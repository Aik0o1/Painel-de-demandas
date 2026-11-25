from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from core.security import get_current_user
from core.models_sql import User
import os

router = APIRouter()

UPLOAD_DIR = os.path.realpath("uploads")
CATEGORIES = {"avatars", "documents", "it_reports", "contracts"}


def _serve(*parts: str) -> FileResponse:
    file_path = os.path.realpath(os.path.join(UPLOAD_DIR, *parts))
    # Prevenção de path traversal: o arquivo precisa estar dentro de uploads/
    if not file_path.startswith(UPLOAD_DIR + os.sep):
        raise HTTPException(status_code=403, detail="Acesso não autorizado")
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    return FileResponse(file_path)


@router.get("/{category}/{filename}")
async def get_uploaded_file(
    category: str,
    filename: str,
    user: User = Depends(get_current_user)
):
    """Serve arquivos de uploads/<categoria>/ apenas para usuários autenticados."""
    if category not in CATEGORIES:
        raise HTTPException(status_code=404, detail="Categoria inválida")
    return _serve(category, filename)


@router.get("/{filename}")
async def get_legacy_uploaded_file(
    filename: str,
    user: User = Depends(get_current_user)
):
    """Comprovantes de pagamento antigos, gravados direto em uploads/."""
    return _serve(filename)
