from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import joinedload
from core.database_sql import get_db
from core.models_sql import User, UserStatus, Session
from passlib.context import CryptContext
from datetime import datetime
from core.security import get_current_user
import os

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserUpdate(BaseModel):
    userId: str
    status: str
    role: str
    sector_id: Optional[str] = None
    permissions: Optional[Dict[str, Any]] = None

class ResetPasswordRequest(BaseModel):
    userId: str
    newPassword: str

@router.get("/users", status_code=status.HTTP_200_OK)
async def list_users(db_session: AsyncSession = Depends(get_db)):
    """Lista todos os usuários cadastrados no sistema."""
    try:
        result = await db_session.execute(select(User).order_by(User.createdAt.desc()))
        users = result.scalars().all()
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar usuários: {str(e)}")

@router.put("/users", status_code=status.HTTP_200_OK)
async def update_user(data: UserUpdate, user: User = Depends(get_current_user), db_session: AsyncSession = Depends(get_db)):
    # Limit to Master Admin or users with admin update permission
    if user.role != "MASTER_ADMIN" and not (user.permissions or {}).get("admin", {}).get("update"):
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    """Atualiza status, role e permissões de um usuário específico."""
    try:
        result = await db_session.execute(select(User).where(User.id == data.userId))
        target_user = result.scalar_one_or_none()
        
        if not target_user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        
        target_user.status = UserStatus(data.status)
        target_user.role = data.role
        target_user.sector_id = data.sector_id
        target_user.updatedAt = datetime.utcnow()
        
        if data.permissions is not None:
            target_user.permissions = data.permissions
        
        await db_session.commit()
        return {"success": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Valor de status inválido: {str(e)}")
    except Exception as e:
        await db_session.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar usuário: {str(e)}")

@router.post("/users/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(data: ResetPasswordRequest, user: User = Depends(get_current_user), db_session: AsyncSession = Depends(get_db)):
    if user.role != "MASTER_ADMIN" and not (user.permissions or {}).get("admin", {}).get("update"):
        raise HTTPException(status_code=403, detail="Acesso negado")

    """Redefine a senha de um usuário."""
    result = await db_session.execute(select(User).where(User.id == data.userId))
    target_user = result.scalar_one_or_none()
    
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Hash da nova senha usando bcrypt (mesmo padrão do NextAuth/Node)
    hashed_password = pwd_context.hash(data.newPassword)
    target_user.passwordHash = hashed_password
    target_user.updatedAt = datetime.utcnow()
    
    await db_session.commit()
    return {"success": True}

@router.get("/sessions", status_code=status.HTTP_200_OK)
async def list_active_sessions(user: User = Depends(get_current_user), db_session: AsyncSession = Depends(get_db)):
    if user.role != "MASTER_ADMIN" and not (user.permissions or {}).get("admin", {}).get("read"):
        raise HTTPException(status_code=403, detail="Acesso negado")

    """Lista sessões ativas com dados do usuário."""
    try:
        result = await db_session.execute(
            select(Session)
            .options(joinedload(Session.user))
            .where(Session.isActive == True)
            .order_by(Session.createdAt.desc())
        )
        sessions = result.scalars().all()
        
        return [
            {
                "id": s.id,
                "sessionId": s.sessionId,
                "startTime": s.createdAt.isoformat(),
                "ipAddress": s.ipAddress,
                "userAgent": s.userAgent,
                "user": {
                    "name": s.user.name,
                    "email": s.user.email,
                    "image": s.user.image
                } if s.user else None
            }
            for s in sessions
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao listar sessões: {str(e)}")

@router.post("/sessions/terminate", status_code=status.HTTP_200_OK)
async def terminate_session(data: Dict[str, str], user: User = Depends(get_current_user), db_session: AsyncSession = Depends(get_db)):
    if user.role != "MASTER_ADMIN" and not (user.permissions or {}).get("admin", {}).get("delete"):
        raise HTTPException(status_code=403, detail="Acesso negado")

    """Encerra (deleta) uma sessão específica."""
    session_id = data.get("sessionId")
    if not session_id:
        raise HTTPException(status_code=400, detail="sessionId é obrigatório")
        
    result = await db_session.execute(delete(Session).where(Session.sessionId == session_id))
    await db_session.commit()
    
    return {"success": True, "deleted_count": result.rowcount}
