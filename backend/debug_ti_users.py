
import asyncio
import os
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_session_maker, AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from core.models_sql import User, Sector

# Mimetizando a conexao do backend
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://demand_user:demand_pass@localhost:5432/demand_db")

async def test_ti_users():
    engine = create_async_engine(DATABASE_URL)
    async_session = create_async_session_maker(engine, expire_on_commit=False, class_=AsyncSession)
    
    async with async_session() as session:
        # 1. Buscar o setor TI pelo slug
        ti_sector_result = await session.execute(
            select(Sector).where(Sector.slug == "ti")
        )
        ti_sector = ti_sector_result.scalar_one_or_none()
        
        print(f"Setor TI encontrado: {ti_sector.name if ti_sector else 'Nenhum'}")
        if ti_sector:
            print(f"ID do Setor: {ti_sector.id}")
            
            # 2. Buscar usuarios desse setor
            result = await session.execute(
                select(User).where(User.sector_id == ti_sector.id)
            )
            users = result.scalars().all()
            print(f"Usuarios da TI encontrados: {len(users)}")
            for user in users:
                print(f" - {user.name} (ID: {user.id})")
        else:
            print("Setor 'ti' nao encontrado via slug.")

if __name__ == "__main__":
    asyncio.run(test_ti_users())
