from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.database_sql import get_db
from core.models_sql import Notification, User
from core.security import get_current_user

router = APIRouter()


class MarkReadRequest(BaseModel):
    id: Optional[str] = None
    all: bool = False


def format_notification(n: Notification):
    return {
        "id": n.id,
        "title": n.title,
        "message": n.message,
        "type": n.type,
        "read": n.read,
        "link": n.link,
        "created_at": n.createdAt.isoformat() if n.createdAt else None,
    }


@router.get("")
async def list_notifications(user: User = Depends(get_current_user), db_session: AsyncSession = Depends(get_db)):
    """Últimas 50 notificações do usuário logado."""
    result = await db_session.execute(
        select(Notification)
        .where(Notification.userId == user.id)
        .order_by(Notification.createdAt.desc())
        .limit(50)
    )
    return [format_notification(n) for n in result.scalars().all()]


@router.put("")
async def mark_as_read(body: MarkReadRequest, user: User = Depends(get_current_user), db_session: AsyncSession = Depends(get_db)):
    """Marca uma notificação ({"id": ...}) ou todas ({"all": true}) como lidas."""
    stmt = update(Notification).where(Notification.userId == user.id, Notification.read == False)  # noqa: E712
    if not body.all:
        if not body.id:
            raise HTTPException(status_code=400, detail="Informe 'id' ou 'all'")
        stmt = stmt.where(Notification.id == body.id)
    result = await db_session.execute(stmt.values(read=True))
    await db_session.commit()
    return {"success": True, "updated": result.rowcount}
