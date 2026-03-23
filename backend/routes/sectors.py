from fastapi import APIRouter, status, Depends
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database_sql import get_db
from core.models_sql import Sector

router = APIRouter()

@router.get("", status_code=status.HTTP_200_OK)
async def list_sectors(db_session: AsyncSession = Depends(get_db)):
    result = await db_session.execute(select(Sector).order_by(Sector.name))
    sectors = result.scalars().all()
    
    if not sectors:
        # Se a tabela estiver vazia, retornar os padrões fixos (ou popular o banco)
        default_sectors = [
            {"id": "financeira", "name": "Diretoria Financeira", "slug": "financeira"},
            {"id": "administrativa", "name": "Diretoria Administrativa", "slug": "administrativa"},
            {"id": "registro", "name": "Diretoria de Registro", "slug": "registro"},
            {"id": "comunicacao", "name": "Setor de Comunicação", "slug": "comunicacao"},
            {"id": "ti", "name": "Tecnologia da Informação", "slug": "ti"},
            {"id": "procuradoria", "name": "Procuradoria", "slug": "procuradoria"}
        ]
        return default_sectors

    return [
        {"id": s.id, "name": s.name, "slug": s.slug}
        for s in sectors
    ]
