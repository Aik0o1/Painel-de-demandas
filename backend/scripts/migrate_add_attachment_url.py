import asyncio
import os
import sys

# Add the parent directory to sys.path so we can import 'core'
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.database_sql import engine
from sqlalchemy import text

async def alter_tables():
    print("Conectando ao banco para aplicar a migração...")
    
    async with engine.begin() as conn:
        try:
            await conn.execute(text('ALTER TABLE contracts ADD COLUMN "attachmentUrl" VARCHAR(1024);'))
            print("✅ Coluna 'attachmentUrl' adicionada na tabela 'contracts'")
        except Exception as e:
            if "already exists" in str(e) or "DuplicateColumnError" in str(e):
                 print("ℹ️ Coluna 'attachmentUrl' já existe na tabela 'contracts'")
            else:
                 print(f"❌ Erro ao alterar 'contracts': {e}")
            
    async with engine.begin() as conn:
        try:
            await conn.execute(text('ALTER TABLE payments ADD COLUMN "attachmentUrl" VARCHAR(1024);'))
            print("✅ Coluna 'attachmentUrl' adicionada na tabela 'payments'")
        except Exception as e:
            if "already exists" in str(e) or "DuplicateColumnError" in str(e):
                 print("ℹ️ Coluna 'attachmentUrl' já existe na tabela 'payments'")
            else:
                 print(f"❌ Erro ao alterar 'payments': {e}")
                 
    print("KMigração concluída!")

if __name__ == "__main__":
    asyncio.run(alter_tables())
