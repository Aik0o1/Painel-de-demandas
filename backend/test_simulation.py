import asyncio
import os
import sys
from datetime import datetime
import uuid

# Set current dir to project root (backend)
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.database_sql import async_session_maker
from core.models_sql import WeeklyDemand
from sqlalchemy import select

async def simulate_get():
    async with async_session_maker() as db_session:
        print("Starting simulation of GET /weekly-demands")
        result = await db_session.execute(select(WeeklyDemand).where(WeeklyDemand.sector == "comunicacao"))
        demand = result.scalar_one_or_none()
        
        if not demand:
            print("No demand found, creating one...")
            now = datetime.utcnow()
            demand = WeeklyDemand(
                id=str(uuid.uuid4()),
                sector="comunicacao",
                content="",
                lastUpdatedBy="Sistema",
                createdAt=now,
                updatedAt=now
            )
            db_session.add(demand)
            await db_session.commit()
            print("Demand created and committed!")
            await db_session.refresh(demand)
        
        print(f"Demand data: id={demand.id}, sector={demand.sector}, content={demand.content}")

if __name__ == "__main__":
    asyncio.run(simulate_get())
