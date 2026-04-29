from fastapi import APIRouter, HTTPException, Security, Depends
from fastapi.responses import StreamingResponse
from fastapi.security import APIKeyHeader
import os
import io
from core.couchdb_client import get_registro_db
from services.pdf_generator import gerar_relatorio_from_data

from core.security import get_current_user
from core.models_sql import User

router = APIRouter()

# API Token validation
API_TOKEN = os.getenv("COUCHDB_API_TOKEN")
api_key_header = APIKeyHeader(name="X-API-Token", auto_error=False)

def verify_token(token: str = Security(api_key_header)):
    if not token or token != API_TOKEN:
        raise HTTPException(status_code=403, detail="Token inválido ou ausente")
    return token


@router.get("/docs", summary="Lista todos os documentos do banco de registro")
def list_docs(
    user: User = Depends(get_current_user),
    token: str = Security(verify_token)
):
    """Retorna todos os documentos do banco painel_de_demandas_dados_registro."""
    try:
        db = get_registro_db()
        docs = [db[doc_id] for doc_id in db]
        return {"total": len(docs), "data": docs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/docs/{doc_id}", summary="Busca um documento específico por ID")
def get_doc(
    doc_id: str,
    user: User = Depends(get_current_user),
    token: str = Security(verify_token)
):
    """Retorna um documento específico pelo seu _id do CouchDB."""
    try:
        db = get_registro_db()
        if doc_id not in db:
            raise HTTPException(status_code=404, detail=f"Documento '{doc_id}' não encontrado")
        return dict(db[doc_id])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/info", summary="Informações do banco de dados CouchDB")
def db_info(
    user: User = Depends(get_current_user),
    token: str = Security(verify_token)
):
    """Retorna metadados do banco de dados painel_de_demandas_dados_registro."""
    try:
        db = get_registro_db()
        return db.info()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
