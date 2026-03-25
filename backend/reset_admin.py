import os
from sqlalchemy import create_engine, select, update
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from core.models_sql import User, UserStatus
from core.database_sql import Base

# Setup the context matching the backend
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def reset_password(email, new_password):
    db_url = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5433/demand_navigator")
    engine = create_engine(db_url)
    
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
        print(f"Senha do usuário {email} resetada com sucesso para: {new_password}")

if __name__ == "__main__":
    import sys
    email = sys.argv[1] if len(sys.argv) > 1 else "admin@jucepi.pi.gov.br"
    password = sys.argv[2] if len(sys.argv) > 2 else "admin123"
    reset_password(email, password)
