from fastapi import HTTPException, status, Header, Depends
from typing import Optional, Dict, Any
import jwt
import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database_sql import get_db
from core.models_sql import User

SECRET_KEY = os.getenv("NEXTAUTH_SECRET", "al-eT3JbEwLKT7kU5gtSDI1JK3YyFCKu9cdV3G3SMDdCnn")
ALGORITHM = "HS256"

async def get_current_user(
    authorization: Optional[str] = Header(None),
    x_user_email: Optional[str] = Header(None),
    db_session: AsyncSession = Depends(get_db)
):
    email = None
    if x_user_email:
        email = x_user_email
    elif authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email = payload.get("email")
        except Exception as e:
            print(f"JWT Decode error: {e}")
            raise HTTPException(status_code=401, detail="Token inválido ou expirado")
    
    if not email:
        print(f"Sessão não identificada. Headers: auth={authorization is not None}, x-email={x_user_email is not None}")
        raise HTTPException(status_code=401, detail="Sessão não identificada")

    result = await db_session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
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
