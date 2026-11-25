"""Criação de notificações para o sino do menu."""
import uuid
from datetime import datetime
from typing import Iterable, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.models_sql import Notification, User


def notify(
    db_session: AsyncSession,
    user_ids: Iterable[Optional[str]],
    title: str,
    message: str,
    link: Optional[str] = None,
    type: str = "INFO",
    actor: Optional[User] = None,
) -> None:
    """
    Adiciona uma notificação para cada usuário (sem duplicar e sem notificar
    quem executou a ação). O commit fica a cargo de quem chama, junto com a
    alteração que gerou a notificação.
    """
    now = datetime.utcnow()
    for user_id in {u for u in user_ids if u}:
        if actor is not None and user_id == actor.id:
            continue
        db_session.add(Notification(
            id=str(uuid.uuid4()),
            userId=user_id,
            title=title[:255],
            message=message,
            type=type,
            link=link,
            read=False,
            createdAt=now,
        ))


async def user_id_by_email(db_session: AsyncSession, email: Optional[str]) -> Optional[str]:
    if not email:
        return None
    result = await db_session.execute(select(User.id).where(User.email == email))
    return result.scalar_one_or_none()
