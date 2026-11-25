from fastapi import HTTPException, status, Header, Depends
from typing import Optional, Dict, Any
import jwt
import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database_sql import get_db
from core.models_sql import User, UserStatus, Session

SECRET_KEY = os.getenv("NEXTAUTH_SECRET")
if not SECRET_KEY:
    # Em produção, isso deve interromper o startup
    raise RuntimeError("NEXTAUTH_SECRET MUST be set in environment variables!")
ALGORITHM = "HS256"

from starlette.requests import Request

async def get_current_user(
    request: Request,
    db_session: AsyncSession = Depends(get_db)
):
    """
    Identifica o usuário pelo JWT (HS256, NEXTAUTH_SECRET) que o middleware do
    Next.js anexa a cada chamada /api/*. Nenhum outro header é aceito como
    identidade: o antigo fallback X-User-Email permitia se passar por qualquer
    usuário sem senha.
    """
    authorization = request.headers.get("authorization") or ""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Sessão não identificada")

    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Sessão expirada")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=401, detail="Token inválido")

    result = await db_session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")

    if user.status != UserStatus.ACTIVE:
        raise HTTPException(status_code=403, detail="Usuário sem acesso ativo")

    # Sessão encerrada (logout ou "Encerrar sessão" no painel admin)
    sid = payload.get("sid")
    if sid:
        session_result = await db_session.execute(
            select(Session.isActive).where(Session.sessionId == sid)
        )
        if not session_result.scalar_one_or_none():
            raise HTTPException(status_code=401, detail="Sessão encerrada")

    request.state.user_id = user.id
    return user

def check_permission(module: str, action: str):
    """
    Dependency factor to check permissions for a specific module and action.
    Usage: Depends(check_permission("procuradoria", "create"))
    """
    async def permission_checker(user: User = Depends(get_current_user)):
        # Master Admin has full access
        if user.role == "MASTER_ADMIN":
            return user
            
        permissions = user.permissions or {}
        module_perms = permissions.get(module, {})
        
        # Check if the user has the specific action permission
        if not module_perms.get(action):
            raise HTTPException(
                status_code=403, 
                detail=f"Você não tem permissão para {action} no módulo {module}"
            )
            
        return user
        
    return permission_checker
