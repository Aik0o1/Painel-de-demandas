from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database_sql import get_db
from core.models_sql import User
from core.security import get_current_user

router = APIRouter()

def format_user_summary(user: User):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "sector_id": user.sector_id
    }

@router.get("/sector/{sector_id}", status_code=status.HTTP_200_OK)
async def list_users_by_sector(
    sector_id: str,
    db_session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista usuários simplificados de um setor específico."""
    try:
        result = await db_session.execute(
            select(User)
            .where(User.sector_id == sector_id)
            .order_by(User.name)
        )
        users = result.scalars().all()
        return [format_user_summary(u) for u in users]
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao buscar usuários do setor: {str(e)}"
        )
