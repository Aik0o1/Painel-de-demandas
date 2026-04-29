"""
Script de migração para criar tabela ticket_assignees.
Requer DATABASE_URL definida no ambiente.
"""
import asyncio
import os
import sys
from sqlalchemy.ext.asyncio import create_async_engine

# SECURITY FIX: Remove hardcoded credentials, require env var
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERRO CRÍTICO: Variável de ambiente DATABASE_URL não definida.")
    sys.exit(1)

# Garante que está usando o driver async
if not DATABASE_URL.startswith("postgresql+asyncpg"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

async def run():
    # SECURITY FIX: Remove echo=True para não logar dados sensíveis
    engine = create_async_engine(DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        from sqlalchemy import text
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS ticket_assignees (
                ticket_id VARCHAR(36) REFERENCES tickets(id) ON DELETE CASCADE,
                user_id VARCHAR(36) REFERENCES "User"(id) ON DELETE CASCADE,
                PRIMARY KEY (ticket_id, user_id)
            );
        """))
        await conn.execute(text("""
            INSERT INTO ticket_assignees (ticket_id, user_id)
            SELECT id, "assignedToId" FROM tickets WHERE "assignedToId" IS NOT NULL
            ON CONFLICT DO NOTHING;
        """))
    await engine.dispose()
    print("Migração de ticket_assignees concluída com sucesso.")

if __name__ == '__main__':
    asyncio.run(run())
