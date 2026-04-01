import asyncio
from sqlalchemy.ext.asyncio import create_async_engine

async def run():
    engine = create_async_engine("postgresql+asyncpg://postgres:password@localhost:5433/demand_navigator", echo=True)
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

if __name__ == '__main__':
    asyncio.run(run())
