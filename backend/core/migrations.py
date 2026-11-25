"""
Migrações de esquema idempotentes, executadas na inicialização da API.

O projeto não usa Alembic; as tabelas existentes foram criadas por
setup_initial_data.py / Prisma. Cada passo aqui pode rodar várias vezes sem
efeito colateral (IF NOT EXISTS / checkfirst), então é seguro em bancos novos
e no banco de produção.
"""
import logging

from sqlalchemy import text

from core.database_sql import engine, Base

logger = logging.getLogger(__name__)

# Comandos SQL aplicados em ordem. Só acrescente itens idempotentes.
STATEMENTS = [
    # Valor estimado do patrimônio (formulário do inventário)
    'ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS "value" DOUBLE PRECISION',
]

# Tabelas novas criadas se ainda não existirem.
NEW_TABLES: list = []


async def run_migrations() -> None:
    async with engine.begin() as conn:
        if NEW_TABLES:
            await conn.run_sync(lambda sync_conn: Base.metadata.create_all(
                sync_conn, tables=[t.__table__ for t in NEW_TABLES], checkfirst=True
            ))
        for statement in STATEMENTS:
            await conn.execute(text(statement))
    logger.info("Migrações de esquema aplicadas.")
