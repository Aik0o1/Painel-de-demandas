import asyncio
import os
import sys
from dotenv import load_dotenv

load_dotenv()

# Adiciona o diretório atual ao sys.path para importar core
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.database_sql import engine, Base
# Importar os modelos para que o Base os conheça
import core.models_sql

async def create_tables():
    print("Creating tables in PostgreSQL...")
    async with engine.begin() as conn:
        # await conn.run_sync(Base.metadata.drop_all) # Opcional: remover tudo se necessário
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created successfully!")

if __name__ == "__main__":
    asyncio.run(create_tables())
