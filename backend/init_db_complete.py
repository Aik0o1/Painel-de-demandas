import asyncio
import os
import sys
import uuid
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Adiciona o diretório atual ao sys.path para importar core
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.database_sql import engine, Base, async_session_maker
from core.models_sql import Sector, BudgetCategory, User

# Importar todos os modelos para que o Base os conheça
import core.models_sql

async def init_db():
    print("Iniciando criação de tabelas no PostgreSQL (5433)...")
    async with engine.begin() as conn:
        # Cria todas as tabelas definidas em models_sql.py (demands, tickets, payments, etc.)
        await conn.run_sync(Base.metadata.create_all)
    print("Tabelas criadas com sucesso!")

    print("Verificando dados iniciais...")
    async with async_session_maker() as session:
        # 1. Popular Setores se estiver vazio
        from sqlalchemy import select
        result = await session.execute(select(Sector))
        if not result.scalars().first():
            print("Populando setores padrão...")
            setores = [
                {"name": "TI", "slug": "ti"},
                {"name": "Comunicação", "slug": "comunicacao"},
                {"name": "Financeiro", "slug": "financeiro"},
                {"name": "Administrativo", "slug": "administrativo"},
                {"name": "Procuradoria", "slug": "procuradoria"},
                {"name": "Registro", "slug": "registro"},
                {"name": "Presidência", "slug": "presidencia"}
            ]
            for s_data in setores:
                session.add(Sector(id=str(uuid.uuid4()), name=s_data["name"], slug=s_data["slug"]))
            await session.commit()
            print("Setores criados.")

        # 2. Popular Categorias de Orçamento se estiver vazio
        result = await session.execute(select(BudgetCategory))
        if not result.scalars().first():
            print("Populando categorias de orçamento padrão...")
            categorias = [
                {"name": "Hardware e Equipamentos", "total": 50000.0},
                {"name": "Softwares e Licenças", "total": 30000.0},
                {"name": "Manutenção Predial", "total": 20000.0},
                {"name": "Serviços de Terceiros", "total": 45000.0},
                {"name": "Material de Expediente", "total": 10000.0},
                {"name": "Viagens e Diárias", "total": 15000.0}
            ]
            for cat in categorias:
                session.add(BudgetCategory(
                    id=str(uuid.uuid4()), 
                    name=cat["name"], 
                    totalAllocated=cat["total"]
                ))
            await session.commit()
            print("Categorias de orçamento criadas.")

    print("Banco de Dados inicializado completamente!")

if __name__ == "__main__":
    asyncio.run(init_db())
