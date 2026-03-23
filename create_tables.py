import asyncio
import sys
import os
from dotenv import load_dotenv

# Adiciona o diretório backend ao path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

# Carrega as variáveis de ambiente do backend
load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))

from core.database_sql import engine, Base
from core.models_sql import * # Importa todos os modelos para registrar no Base

async def init_models():
    async with engine.begin() as conn:
        # await conn.run_sync(Base.metadata.drop_all) # Opcional: limpa o banco
        await conn.run_sync(Base.metadata.create_all)
    print("Tabelas criadas com sucesso!")

if __name__ == "__main__":
    asyncio.run(init_models())
