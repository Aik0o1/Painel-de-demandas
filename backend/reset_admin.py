"""
Script administrativo para reset de senha de usuário.
Requer DATABASE_URL definida no ambiente.
Uso: python reset_admin.py <email> <nova_senha>
"""
import os
import sys
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from core.models_sql import User, UserStatus
from core.database_sql import Base

# Setup the context matching the backend
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# SECURITY FIX: Remove hardcoded credentials, require env var
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERRO CRÍTICO: Variável de ambiente DATABASE_URL não definida.")
    print("Este script não pode ser executado sem credenciais explícitas.")
    sys.exit(1)

def reset_password(email, new_password):
    engine = create_engine(DATABASE_URL)

    with Session(engine) as session:
        # Find user
        stmt = select(User).where(User.email == email)
        user = session.execute(stmt).scalar_one_or_none()

        if not user:
            print(f"Usuário {email} não encontrado.")
            return

        # Hash new password (using truncation like backend)
        hashed_password = pwd_context.hash(new_password.encode("utf-8")[:72])

        # Update user
        user.passwordHash = hashed_password
        user.status = UserStatus.ACTIVE # Ensure active

        session.commit()
        print(f"Senha do usuário {email} resetada com sucesso.")
        print("IMPORTANTE: O usuário deve alterar a senha no primeiro login.")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Uso: python reset_admin.py <email> <nova_senha>")
        print("Exemplo: python reset_admin.py admin@jucepi.pi.gov.br SenhaForte123!")
        sys.exit(1)
    
    email = sys.argv[1]
    password = sys.argv[2]
    
    # Validação básica de senha forte
    if len(password) < 8:
        print("ERRO: A senha deve ter pelo menos 8 caracteres.")
        sys.exit(1)
    
    reset_password(email, password)
