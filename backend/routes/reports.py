import csv
import io
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from core.database_sql import get_db
from core.models_sql import User, Demand, FinanceTransaction, RegistryEntry, Ticket, Employee, Project, WeeklyDemand, BudgetCategory
from core.security import get_current_user

router = APIRouter()

def parse_date(v: Optional[str]) -> Optional[datetime]:
    if not v:
        return None
    try:
        if "T" in v:
            return datetime.fromisoformat(v.replace("Z", "+00:00"))
        return datetime.strptime(v, "%Y-%m-%d")
    except (ValueError, TypeError):
        return None

@router.get("")
async def generate_report(
    type: str = Query(...),
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    user: User = Depends(get_current_user),
    db_session: AsyncSession = Depends(get_db)
):
    valid_types = ["demands", "finance", "registry", "ti", "employees", "communication"]
    if type not in valid_types:
        raise HTTPException(status_code=400, detail="Invalid report type")

    start_dt = parse_date(start)
    end_dt = parse_date(end)
    if end_dt:
        end_dt = end_dt.replace(hour=23, minute=59, second=59)

    output = io.StringIO()
    # Add BOM for Excel compatibility with UTF-8
    output.write('\ufeff')
    writer = csv.writer(output, delimiter=';', quoting=csv.QUOTE_MINIMAL)

    if type == "demands":
        stmt = select(Demand).order_by(Demand.createdAt.desc())
        if start_dt: stmt = stmt.where(Demand.createdAt >= start_dt)
        if end_dt: stmt = stmt.where(Demand.createdAt <= end_dt)
        
        result = await db_session.execute(stmt)
        items = result.scalars().all()
        
        writer.writerow(["ID", "Título", "Prioridade", "Status", "Criado Por", "Responsável", "Data de Vencimento", "Criado Em"])
        for item in items:
            writer.writerow([
                item.id,
                item.title,
                item.priority,
                item.status,
                item.createdBy,
                item.assignedTo,
                item.dueDate.isoformat() if item.dueDate else "",
                item.createdAt.isoformat() if item.createdAt else ""
            ])

    elif type == "finance":
        stmt = select(FinanceTransaction).order_by(FinanceTransaction.date.desc())
        if start_dt: stmt = stmt.where(FinanceTransaction.date >= start_dt)
        if end_dt: stmt = stmt.where(FinanceTransaction.date <= end_dt)
        
        result = await db_session.execute(stmt)
        items = result.scalars().all()
        
        writer.writerow(["ID", "Descrição", "Valor", "Fornecedor", "Data", "Status", "Categoria"])
        for item in items:
            cat_name = "Geral"
            if item.categoryId:
                cat_res = await db_session.execute(select(BudgetCategory).where(BudgetCategory.id == item.categoryId))
                cat = cat_res.scalar_one_or_none()
                if cat:
                    cat_name = cat.name
            
            writer.writerow([
                item.id,
                item.description,
                format(item.amount or 0, ".2f"),
                item.supplier,
                item.date.isoformat() if item.date else "",
                item.status,
                cat_name
            ])

    elif type == "registry":
        stmt = select(RegistryEntry).order_by(RegistryEntry.createdAt.desc())
        if start_dt: stmt = stmt.where(RegistryEntry.createdAt >= start_dt)
        if end_dt: stmt = stmt.where(RegistryEntry.createdAt <= end_dt)
        
        result = await db_session.execute(stmt)
        items = result.scalars().all()
        
        writer.writerow(["ID", "Protocolo", "Tipo de Documento", "Parte", "Status", "Criado Em"])
        for item in items:
            writer.writerow([
                item.id,
                item.protocolNumber,
                item.documentType,
                item.partyName,
                item.status,
                item.createdAt.isoformat() if item.createdAt else ""
            ])

    elif type == "ti":
        stmt = select(Ticket).order_by(Ticket.createdAt.desc())
        if start_dt: stmt = stmt.where(Ticket.createdAt >= start_dt)
        if end_dt: stmt = stmt.where(Ticket.createdAt <= end_dt)
        
        result = await db_session.execute(stmt)
        items = result.scalars().all()
        
        writer.writerow(["ID", "Título", "Requisitante", "Prioridade", "Categoria", "Status", "Tempo Acumulado (ms)", "Criado Em"])
        for item in items:
            writer.writerow([
                item.id,
                item.title,
                item.requesterName,
                item.priority,
                item.category,
                item.status,
                item.accumulatedTimeMs or 0,
                item.createdAt.isoformat() if item.createdAt else ""
            ])

    elif type == "employees":
        stmt = select(Employee).order_by(Employee.createdAt.desc())
        if start_dt: stmt = stmt.where(Employee.createdAt >= start_dt)
        if end_dt: stmt = stmt.where(Employee.createdAt <= end_dt)
        
        result = await db_session.execute(stmt)
        items = result.scalars().all()
        
        writer.writerow(["ID", "Nome Completo", "Cargo", "Departamento", "Data de Admissão", "Status"])
        for item in items:
            writer.writerow([
                item.id,
                item.fullName,
                item.position,
                item.department,
                item.admissionDate.isoformat() if item.admissionDate else "",
                item.status
            ])

    elif type == "communication":
        # Projects
        stmt = select(Project).order_by(Project.createdAt.desc())
        if start_dt: stmt = stmt.where(Project.createdAt >= start_dt)
        if end_dt: stmt = stmt.where(Project.createdAt <= end_dt)
        
        result = await db_session.execute(stmt)
        items = result.scalars().all()
        
        writer.writerow(["TIPO", "Título/Conteúdo", "Status/Responsável", "Prioridade", "Criado Em"])
        for item in items:
            writer.writerow([
                "PROJETO",
                item.title,
                item.status,
                item.priority,
                item.createdAt.isoformat() if item.createdAt else ""
            ])
        
        # Weekly demand
        weekly_result = await db_session.execute(select(WeeklyDemand).where(WeeklyDemand.sector == "comunicacao"))
        weekly = weekly_result.scalar_one_or_none()
        if weekly:
             writer.writerow(["DEMANDA SEMANAL", weekly.content, weekly.lastUpdatedBy, "", weekly.updatedAt.isoformat() if weekly.updatedAt else ""])

    csv_content = output.getvalue()
    return StreamingResponse(
        io.BytesIO(csv_content.encode("utf-8")),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=relatorio_{type}_{datetime.now().strftime('%Y%m%d')}.csv"
        }
    )
