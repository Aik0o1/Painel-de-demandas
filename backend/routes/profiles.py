from fastapi import APIRouter, HTTPException, status, Header, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from core.database_sql import get_db
from core.models_sql import User
from core.security import get_current_user
from passlib.context import CryptContext
import os

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

router = APIRouter()

def format_profile(user: User):
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "full_name": user.name, # Compatibilidade
        "role": user.role,
        "image": user.image,
        "status": user.status,
        "sector_id": user.sector_id,
        "cpf": user.cpf or "",
        "position": user.position or "",
        "function": user.function or "",
        "createdAt": user.createdAt.isoformat() if user.createdAt else None
    }

@router.get("/me", status_code=status.HTTP_200_OK)
async def get_my_profile(user: User = Depends(get_current_user)):
    return format_profile(user)

@router.get("", status_code=status.HTTP_200_OK)
async def list_profiles(db_session: AsyncSession = Depends(get_db)):
    result = await db_session.execute(select(User).order_by(User.name))
    users = result.scalars().all()
    return [format_profile(u) for u in users]

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    cpf: Optional[str] = None
    position: Optional[str] = None
    function: Optional[str] = None
    image: Optional[str] = None

@router.post("/update", status_code=status.HTTP_200_OK)
async def update_profile(updates: ProfileUpdate, user: User = Depends(get_current_user), db_session: AsyncSession = Depends(get_db)):
    update_data = updates.dict(exclude_unset=True)
    if not update_data:
        return {"success": True}

    if "full_name" in update_data:
        user.name = update_data["full_name"]
    if "cpf" in update_data:
        user.cpf = update_data["cpf"]
    if "position" in update_data:
        user.position = update_data["position"]
    if "function" in update_data:
        user.function = update_data["function"]
    if "image" in update_data:
        user.image = update_data["image"]

    await db_session.commit()
    return {"success": True}

class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str

@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db_session: AsyncSession = Depends(get_db)
):
    # Verifica a senha atual
    # Bcrypt tem um limite de 72 bytes; usamos encode para truncar nos BYTES corretamente.
    current_password = data.currentPassword.encode("utf-8")[:72]
    
    if not user.passwordHash or not pwd_context.verify(current_password, user.passwordHash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A senha atual informada está incorreta"
        )
    
    # Atualiza para a nova senha (truncando para o limite de 72 bytes)
    user.passwordHash = pwd_context.hash(data.newPassword.encode("utf-8")[:72])
    await db_session.commit()
    
    return {"success": True}
