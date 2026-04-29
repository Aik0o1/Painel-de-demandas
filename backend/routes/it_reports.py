from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form, Request
from core.limiter import limiter
from fastapi.responses import FileResponse
from core.upload_utils import validate_upload_file
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from core.database_sql import get_db
from core.models_sql import User, ItReport, ItReportDirectory
from core.security import get_current_user
import uuid
import os
import shutil


import subprocess
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

router = APIRouter()

UPLOAD_DIR = "uploads/it_reports"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ────────────────────────── Schemas ──────────────────────────

class ReportGenerate(BaseModel):
    command: str  # 'df', 'last', 'uptime', 'free', 'who'
    directoryId: Optional[str] = None

class DirectoryCreate(BaseModel):
    name: str
    parentId: Optional[str] = None


class DirectoryResponse(BaseModel):
    id: str
    name: str
    parentId: Optional[str]
    createdBy: Optional[str]
    createdAt: str
    fileCount: int = 0


class FileResponse2(BaseModel):
    id: str
    name: str
    originalName: str
    filePath: str
    fileSize: int
    mimeType: Optional[str]
    directoryId: Optional[str]
    uploadedBy: Optional[str]
    createdAt: str


# ────────────────────────── Helpers ──────────────────────────

def fmt_dir(d: ItReportDirectory, file_count: int = 0) -> dict:
    return {
        "id": d.id,
        "name": d.name,
        "parentId": d.parentId,
        "createdBy": d.createdBy,
        "createdAt": d.createdAt.isoformat() if d.createdAt else None,
        "fileCount": file_count,
    }


def fmt_file(f: ItReport) -> dict:
    return {
        "id": f.id,
        "name": f.name,
        "originalName": f.originalName,
        "downloadUrl": f"/api/it-reports/files/{f.id}/download",
        "fileSize": f.fileSize,
        "mimeType": f.mimeType,
        "directoryId": f.directoryId,
        "uploadedBy": f.uploadedBy,
        "createdAt": f.createdAt.isoformat() if f.createdAt else None,
    }


def human_readable_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"


# ────────────────────────── Directory Routes ──────────────────────────

@router.get("/directories", status_code=status.HTTP_200_OK)
async def list_directories(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ItReportDirectory).order_by(ItReportDirectory.name))
    dirs = result.scalars().all()

    # Count files per directory
    dir_ids = [d.id for d in dirs]
    file_counts: dict[str, int] = {}
    if dir_ids:
        files_result = await db.execute(select(ItReport))
        all_files = files_result.scalars().all()
        for f in all_files:
            if f.directoryId:
                file_counts[f.directoryId] = file_counts.get(f.directoryId, 0) + 1

    return [fmt_dir(d, file_counts.get(d.id, 0)) for d in dirs]


@router.post("/directories", status_code=status.HTTP_201_CREATED)
async def create_directory(
    body: DirectoryCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.utcnow()
    new_dir = ItReportDirectory(
        id=str(uuid.uuid4()),
        name=body.name,
        parentId=body.parentId,
        createdBy=user.name,
        createdAt=now,
        updatedAt=now,
    )
    db.add(new_dir)
    await db.commit()
    await db.refresh(new_dir)
    return fmt_dir(new_dir)


@router.delete("/directories/{dir_id}", status_code=status.HTTP_200_OK)
async def delete_directory(
    dir_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Delete files on disk first
    files_result = await db.execute(select(ItReport).where(ItReport.directoryId == dir_id))
    files = files_result.scalars().all()
    for f in files:
        full_path = f.filePath
        if os.path.exists(full_path):
            os.remove(full_path)

    result = await db.execute(delete(ItReportDirectory).where(ItReportDirectory.id == dir_id))
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Diretório não encontrado")

    await db.commit()
    return {"message": "Diretório excluído com sucesso"}


# ────────────────────────── File Routes ──────────────────────────

@router.get("/files", status_code=status.HTTP_200_OK)
async def list_files(
    directoryId: Optional[str] = None,
    search: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(ItReport)

    if directoryId is not None:
        if directoryId == "root":
            query = query.where(ItReport.directoryId == None)
        else:
            query = query.where(ItReport.directoryId == directoryId)

    result = await db.execute(query.order_by(ItReport.createdAt.desc()))
    files = result.scalars().all()

    if search:
        search_lower = search.lower()
        files = [f for f in files if search_lower in f.name.lower() or search_lower in f.originalName.lower()]

    return [fmt_file(f) for f in files]


@router.post("/files/upload", status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    directoryId: Optional[str] = Form(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.utcnow()
    file_id = str(uuid.uuid4())
    extension = os.path.splitext(file.filename or "")[1]
    stored_name = f"{file_id}{extension}"
    stored_path = os.path.join(UPLOAD_DIR, stored_name)

    await validate_upload_file(file)

    # Save file to disk securely
    with open(stored_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(stored_path)

    # Resolve directoryId: if "root" or empty, store as null
    resolved_dir_id: Optional[str] = None
    if directoryId and directoryId not in ("", "root", "null"):
        resolved_dir_id = directoryId

    new_file = ItReport(
        id=file_id,
        name=file.filename or stored_name,
        originalName=file.filename or stored_name,
        filePath=stored_path,
        fileSize=file_size,
        mimeType=file.content_type,
        directoryId=resolved_dir_id,
        uploadedBy=user.name,
        createdAt=now,
        updatedAt=now,
    )
    db.add(new_file)
    await db.commit()
    await db.refresh(new_file)
    return fmt_file(new_file)


@router.post("/generate", status_code=status.HTTP_201_CREATED)
@limiter.limit("10/hour")  # SECURITY FIX: Rate limiting para evitar abuso
async def generate_command_report(
    body: ReportGenerate,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # SECURITY FIX: Remove comandos sensíveis (dmesg, who, top) e limita a comandos seguros
    valid_commands = ["df", "uptime", "free", "lsblk"]
    if body.command not in valid_commands:
        raise HTTPException(status_code=400, detail=f"Comando inválido. Escolha entre: {', '.join(valid_commands)}")

    try:
        # Executa o comando
        command_map = {
            "df": ["df", "-h"],
            "uptime": ["uptime"],
            "free": ["free", "-h"],
            "lsblk": ["lsblk"],
        }
        cmd = command_map.get(body.command)
        if not cmd:
            raise HTTPException(status_code=400, detail="Comando inválido")

        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        output_text = result.stdout

        # Gera o PDF
        now = datetime.utcnow()
        file_id = str(uuid.uuid4())
        filename = f"report_{body.command}_{now.strftime('%Y%m%d_%H%M%S')}.pdf"
        stored_path = os.path.join(UPLOAD_DIR, f"{file_id}.pdf")

        c = canvas.Canvas(stored_path, pagesize=letter)
        width, height = letter
        
        # Título
        c.setFont("Helvetica-Bold", 16)
        c.drawString(50, height - 50, f"Relatório de Sistema: {body.command.upper()}")
        
        # Subtítulo (Metadados)
        c.setFont("Helvetica", 10)
        c.drawString(50, height - 70, f"Gerado em: {now.strftime('%d/%m/%Y %H:%M:%S')}")
        c.drawString(50, height - 85, f"Gerado por: {user.name}")
        c.line(50, height - 90, width - 50, height - 90)

        # Conteúdo (Texto simples)
        c.setFont("Courier", 9)
        text_object = c.beginText(50, height - 110)
        lines = output_text.split("\n")
        for line in lines:
            if text_object.getY() < 50:
                c.drawText(text_object)
                c.showPage()
                text_object = c.beginText(50, height - 50)
                text_object.setFont("Courier", 9)
            text_object.textLine(line)
        c.drawText(text_object)
        
        c.save()

        file_size = os.path.getsize(stored_path)

        # Resolve directoryId
        resolved_dir_id: Optional[str] = None
        if body.directoryId and body.directoryId not in ("", "root", "null"):
            resolved_dir_id = body.directoryId

        # Salva no Banco de Dados
        new_file = ItReport(
            id=file_id,
            name=filename,
            originalName=filename,
            filePath=stored_path,
            fileSize=file_size,
            mimeType="application/pdf",
            directoryId=resolved_dir_id,
            uploadedBy=user.name,
            createdAt=now,
            updatedAt=now,
        )
        db.add(new_file)
        await db.commit()
        await db.refresh(new_file)
        
        return fmt_file(new_file)

    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"Erro ao executar comando: {e.stderr}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar PDF: {str(e)}")


@router.get("/files/{file_id}/download")
async def download_file(
    file_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ItReport).where(ItReport.id == file_id))
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")

    if not os.path.exists(report.filePath):
        raise HTTPException(status_code=404, detail="Arquivo não encontrado no servidor")

    return FileResponse(
        path=report.filePath,
        filename=report.originalName,
        media_type=report.mimeType or "application/octet-stream"
    )


@router.delete("/files/{file_id}", status_code=status.HTTP_200_OK)
async def delete_file(
    file_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(ItReport).where(ItReport.id == file_id))
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")

    # Delete from disk
    if os.path.exists(report.filePath):
        os.remove(report.filePath)

    await db.execute(delete(ItReport).where(ItReport.id == file_id))
    await db.commit()
    return {"message": "Arquivo excluído com sucesso"}
