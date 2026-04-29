from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from core.security import get_current_user
from core.models_sql import User
import os

router = APIRouter()

UPLOAD_DIR = "uploads"

@router.get("/{category}/{filename}")
async def get_uploaded_file(
    category: str,
    filename: str,
    user: User = Depends(get_current_user)
):
    """
    Serve arquivos da pasta uploads apenas para usuários autenticados.
    Categorias válidas: avatars, documents, it_reports
    """
    if category not in ["avatars", "documents", "it_reports"]:
        raise HTTPException(status_code=404, detail="Categoria inválida")

    file_path = os.path.join(UPLOAD_DIR, category, filename)
    
    # Prevenção de Path Traversal
    normalized_path = os.path.normpath(file_path)
    if not normalized_path.startswith(UPLOAD_DIR):
         raise HTTPException(status_code=403, detail="Acesso não autorizado")

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    
    return FileResponse(file_path)
