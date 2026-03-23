from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from core.database_sql import get_db
from core.models_sql import User, WeeklyDemand
from core.security import get_current_user, check_permission

router = APIRouter()

class WeeklyDemandUpdate(BaseModel):
    content: str
    last_updated_by: Optional[str] = "Admin user"

def format_demand(demand: WeeklyDemand):
    return {
        "id": demand.id,
        "sector": demand.sector,
        "content": demand.content,
        "last_updated_by": demand.lastUpdatedBy,
        "createdAt": demand.createdAt.isoformat() if demand.createdAt else None,
        "updatedAt": demand.updatedAt.isoformat() if demand.updatedAt else None
    }

@router.get("", status_code=status.HTTP_200_OK)
async def get_weekly_demand(user: User = Depends(get_current_user), db_session: AsyncSession = Depends(get_db)):
    result = await db_session.execute(select(WeeklyDemand).where(WeeklyDemand.sector == "comunicacao"))
    demand = result.scalar_one_or_none()
    
    if not demand:
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
        await db_session.refresh(demand)

    return format_demand(demand)

@router.post("", status_code=status.HTTP_200_OK)
async def update_weekly_demand(update_data: WeeklyDemandUpdate, user: User = Depends(check_permission("comunicacao", "update")), db_session: AsyncSession = Depends(get_db)):
    result = await db_session.execute(select(WeeklyDemand).where(WeeklyDemand.sector == "comunicacao"))
    demand = result.scalar_one_or_none()
    
    now = datetime.utcnow()
    if not demand:
        demand = WeeklyDemand(
            id=str(uuid.uuid4()),
            sector="comunicacao",
            content=update_data.content,
            lastUpdatedBy=update_data.last_updated_by,
            createdAt=now,
            updatedAt=now
        )
        db_session.add(demand)
    else:
        demand.content = update_data.content
        demand.lastUpdatedBy = update_data.last_updated_by
        demand.updatedAt = now
        
    await db_session.commit()
    await db_session.refresh(demand)
    return format_demand(demand)
