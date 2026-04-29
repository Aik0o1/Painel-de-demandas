from fastapi import APIRouter, HTTPException, status, Depends, Request
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta
from typing import Optional
import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database_sql import get_db
from core.models_sql import User, UserStatus
from core.security import SECRET_KEY, ALGORITHM
from core.limiter import limiter
from core.audit import log_action

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

from pydantic import BaseModel, EmailStr, Field

class LoginRequest(BaseModel):
    email: EmailStr = Field(..., max_length=255)
    password: str = Field(..., min_length=8, max_length=128)

def create_access_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/login")
@limiter.limit("5/minute")
async def login(credentials: LoginRequest, request: Request, db_session: AsyncSession = Depends(get_db)):
    result = await db_session.execute(select(User).where(User.email == credentials.email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas ou e-mail incorreto"
        )
    
    # Verifica o status no PostgreSQL
    if user.status != UserStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Sua conta encontra-se: {user.status.value}"
        )
    
    # Verifica se a senha corresponde ao hash (salvo pelo NextJS no db via bcryptjs)
    # Bcrypt tem um limite de 72 bytes.
    password_bytes = credentials.password.encode("utf-8")
    stored_hash = user.passwordHash
    if not stored_hash or not pwd_context.verify(password_bytes[:72], stored_hash):
        await log_action(
            db_session=db_session,
            action="LOGIN_FAILED",
            module="AUTH",
            description=f"Tentativa de login falha para o e-mail: {credentials.email}",
            user_email=credentials.email,
            request=request
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas"
        )

    # Login bem-sucedido
    await log_action(
        db_session=db_session,
        action="LOGIN_SUCCESS",
        module="AUTH",
        description=f"Usuário {user.email} logou com sucesso",
        user_email=user.email,
        user_name=user.name,
        request=request
    )



    # JWT gerado (Apenas representacional da PHP api antiga)
    # Obs: a autenticação real do Nextjs continuaria via NextAuth na rota web,
    # A menos que o projeto abandone NextAuth de vez pela API.
    token_data = {
        "sub": user.id,
        "email": user.email,
        "role": user.role
    }
    
    access_token = create_access_token(
        data=token_data, expires_delta=timedelta(hours=1)
    )

    return {
        "token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }
