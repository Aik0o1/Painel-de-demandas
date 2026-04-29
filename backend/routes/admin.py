from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import joinedload
from core.database_sql import get_db
from core.models_sql import User, UserStatus, Session
from passlib.context import CryptContext
from datetime import datetime
from core.security import get_current_user
from core.audit import log_action
from fastapi import Request
from core.limiter import limiter
import os

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserUpdate(BaseModel):
    userId: int
    status: str = Field(..., max_length=20)
    role: str = Field(..., max_length=30)
    sector_id: Optional[str] = None
    permissions: Optional[Dict[str, Any]] = None

class ResetPasswordRequest(BaseModel):
    userId: int
    newPassword: str = Field(..., min_length=6)

@router.get("/users", status_code=status.HTTP_200_OK)
@limiter.limit("10/minute")
async def list_users(request: Request, user: User = Depends(get_current_user), db_session: AsyncSession = Depends(get_db)):
    # Limita a Master Admin ou usuários com permissão de leitura de admin
    if user.role != "MASTER_ADMIN" and not (user.permissions or {}).get("admin", {}).get("read"):
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    """Lista todos os usuários cadastrados no sistema."""
    try:
        result = await db_session.execute(select(User).order_by(User.createdAt.desc()))
        users = result.scalars().all()
        # Omit passwordHash before returning
        user_list = []
        for u in users:
            u_dict = {
                "id": u.id,
                "name": u.name,
                "email": u.email,
                "image": u.image,
                "role": u.role,
                "cpf": u.cpf,
                "position": u.position,
                "function": u.function,
                "protocolNumber": u.protocolNumber,
                "status": u.status,
                "permissions": u.permissions,
                "sector_id": u.sector_id,
                "createdAt": u.createdAt,
                "updatedAt": u.updatedAt
            }
            user_list.append(u_dict)
        return user_list
    except Exception:
        raise HTTPException(status_code=500, detail="Erro interno ao listar usuários")

@router.put("/users", status_code=status.HTTP_200_OK)
async def update_user(data: UserUpdate, request: Request, user: User = Depends(get_current_user), db_session: AsyncSession = Depends(get_db)):
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
        
        await log_action(
            db_session=db_session,
            action="UPDATE_USER",
            module="ADMIN",
            description=f"Admin {user.email} atualizou usuário {target_user.email} (Status: {data.status}, Role: {data.role})",
            user_email=user.email,
            user_name=user.name,
            request=request,
            metadata={"target_user_id": data.userId, "new_status": data.status, "new_role": data.role}
        )
        return {"success": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Valor de status inválido: {str(e)}")
    except Exception:
        await db_session.rollback()
        raise HTTPException(status_code=500, detail="Erro interno ao atualizar usuário")

@router.post("/users/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(data: ResetPasswordRequest, request: Request, user: User = Depends(get_current_user), db_session: AsyncSession = Depends(get_db)):
    if user.role != "MASTER_ADMIN" and not (user.permissions or {}).get("admin", {}).get("update"):
        raise HTTPException(status_code=403, detail="Acesso negado")

    """Redefine a senha de um usuário."""
    result = await db_session.execute(select(User).where(User.id == data.userId))
    target_user = result.scalar_one_or_none()
    
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Hash da nova senha usando bcrypt (mesmo padrão do NextAuth/Node)
    # Bcrypt tem um limite de 72 bytes; usamos encode para truncar nos BYTES corretamente.
    hashed_password = pwd_context.hash(data.newPassword.encode("utf-8")[:72])
    target_user.passwordHash = hashed_password
    target_user.updatedAt = datetime.utcnow()
    
    await db_session.commit()
    
    await log_action(
        db_session=db_session,
        action="RESET_PASSWORD",
        module="ADMIN",
        description=f"Admin {user.email} resetou senha do usuário {target_user.email}",
        user_email=user.email,
        user_name=user.name,
        request=request,
        metadata={"target_user_id": data.userId}
    )
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
    except Exception:
        raise HTTPException(status_code=500, detail="Erro interno ao listar sessões")

@router.post("/sessions/terminate", status_code=status.HTTP_200_OK)
async def terminate_session(data: Dict[str, str], request: Request, user: User = Depends(get_current_user), db_session: AsyncSession = Depends(get_db)):
    if user.role != "MASTER_ADMIN" and not (user.permissions or {}).get("admin", {}).get("delete"):
        raise HTTPException(status_code=403, detail="Acesso negado")

    """Encerra (deleta) uma sessão específica."""
    session_id = data.get("sessionId")
    if not session_id:
        raise HTTPException(status_code=400, detail="sessionId é obrigatório")
        
    result = await db_session.execute(delete(Session).where(Session.sessionId == session_id))
    await db_session.commit()
    
    await log_action(
        db_session=db_session,
        action="TERMINATE_SESSION",
        module="ADMIN",
        description=f"Admin {user.email} encerrou a sessão {session_id}",
        user_email=user.email,
        user_name=user.name,
        request=request,
        metadata={"sessionId": session_id}
    )
    
    return {"success": True, "deleted_count": result.rowcount}
