import asyncio
import os
import sys
import uuid
from datetime import datetime
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.database_sql import engine, Base, async_session_maker
from core.models_sql import Sector, BudgetCategory, User, UserStatus
import core.models_sql

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def init_db():
    print("Iniciando configuracao do Banco de Dados...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tabelas criadas.")

    async with async_session_maker() as session:
        # 1. Setores
        from sqlalchemy import select
        result = await session.execute(select(Sector))
        if not result.scalars().first():
            print("Populando setores...")
            setores = [
                {"name": "TI", "slug": "ti"},
                {"name": "Comunicacao", "slug": "comunicacao"},
                {"name": "Financeiro", "slug": "financeira"},
                {"name": "Administrativo", "slug": "administrativo"},
                {"name": "Procuradoria", "slug": "procuradoria"},
                {"name": "Registro", "slug": "registro"},
                {"name": "Presidencia", "slug": "presidencia"}
            ]
            for s_data in setores:
                session.add(Sector(id=str(uuid.uuid4()), name=s_data["name"], slug=s_data["slug"]))
            await session.commit()

        # 2. Categorias
        result = await session.execute(select(BudgetCategory))
        if not result.scalars().first():
            print("Populando categorias...")
            categorias = [
                {"name": "Hardware e Equipamentos", "total": 50000.0},
                {"name": "Softwares e Licencas", "total": 30000.0},
                {"name": "Manutencao Predial", "total": 20000.0},
                {"name": "Servicos de Terceiros", "total": 45000.0},
                {"name": "Material de Expediente", "total": 10000.0},
                {"name": "Viagens e Diarias", "total": 15000.0}
            ]
            for cat in categorias:
                session.add(BudgetCategory(id=str(uuid.uuid4()), name=cat["name"], totalAllocated=cat["total"]))
            await session.commit()

        # 3. Usuario Admin
        result = await session.execute(select(User).where(User.email == "admin@admin.com"))
        if not result.scalars().first():
            admin_pw = os.getenv("DEFAULT_ADMIN_PASSWORD")
            if not admin_pw:
                raise ValueError("DEFAULT_ADMIN_PASSWORD must be strictly defined in the environment!")
            print(f"Criando usuario admin (admin@admin.com) com configuracao de ambiente...")
            hashed_pw = pwd_context.hash(admin_pw)
            admin_user = User(
                id=str(uuid.uuid4()),
                name="Administrador",
                email="admin@admin.com",
                role="MASTER_ADMIN",
                status=UserStatus.ACTIVE,
                passwordHash=hashed_pw,
                createdAt=datetime.utcnow(),
                updatedAt=datetime.utcnow()
            )
            session.add(admin_user)
            await session.commit()
            print("Usuario admin criado.")

    print("Setup concluido!")

if __name__ == "__main__":
    asyncio.run(init_db())
