from fastapi import APIRouter, HTTPException, status, Header, Depends, Request
from pydantic import BaseModel
from typing import List, Optional, Any, Dict, Literal
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from core.database_sql import get_db
from core.models_sql import User, Demand
from core.security import get_current_user
from core.limiter import limiter
import uuid

router = APIRouter()

Priority = Literal["low", "medium", "high", "critical"]
Status = Literal["pending", "in_progress", "completed"]


def parse_date(value: Optional[str]) -> Optional[datetime]:
    """Converte ISO 8601 (com ou sem 'Z') para datetime naive em UTC."""
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=422, detail=f"Data inválida: {value}")
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


class DemandCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Priority = "medium"
    assigned_to: Optional[str] = None
    assigned_user_ids: Optional[List[str]] = []
    due_date: Optional[str] = None

class DemandUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[Priority] = None
    status: Optional[Status] = None
    assigned_to: Optional[str] = None
    assigned_user_ids: Optional[List[str]] = None
    due_date: Optional[str] = None
    completed_at: Optional[str] = None

async def populate_user(user_id_or_email: Any, db_session: AsyncSession):
    if not user_id_or_email:
        return None
    
    # Try by ID
    result = await db_session.execute(select(User).where(User.id == str(user_id_or_email)))
    user = result.scalar_one_or_none()
    
    # Try by email if not found
    if not user:
        result = await db_session.execute(select(User).where(User.email == str(user_id_or_email)))
        user = result.scalar_one_or_none()
        
    if user:
        return {
            "full_name": user.name,
            "email": user.email,
            "image": user.image
        }
    return None

async def format_demand(demand: Demand, db_session: AsyncSession):
    if not demand:
        return None
        
    data = {
        "id": demand.id,
        "title": demand.title,
        "description": demand.description,
        "priority": demand.priority,
        "status": demand.status,
        "assignedTo": demand.assignedTo,
        "dueDate": demand.dueDate.isoformat() if demand.dueDate else None,
        "createdBy": demand.createdBy,
        "createdAt": demand.createdAt.isoformat() if demand.createdAt else None,
        "updatedAt": demand.updatedAt.isoformat() if demand.updatedAt else None,
        "completedAt": demand.completedAt.isoformat() if demand.completedAt else None,
    }
    
    # Nomes em snake_case usados pelo frontend (hooks/useDemands.tsx)
    data["assigned_to"] = data["assignedTo"]
    data["due_date"] = data["dueDate"]
    data["created_by"] = data["createdBy"]
    data["created_at"] = data["createdAt"]
    data["updated_at"] = data["updatedAt"]
    data["completed_at"] = data["completedAt"]
    
    data["creator"] = await populate_user(demand.createdBy, db_session)
    data["assignee"] = await populate_user(demand.assignedTo, db_session)
    
    data["assigned_profiles"] = [
        {
            "id": u.id,
            "full_name": u.name,
            "email": u.email,
            "image": u.image
        }
        for u in (demand.assignedUsers or [])
    ]
    data["assigned_user_ids"] = [u.id for u in (demand.assignedUsers or [])]
    data["assignedUsers"] = data["assigned_profiles"] # Legacy support
        
    return data

@router.get("", status_code=status.HTTP_200_OK)
async def get_demands(
    user: User = Depends(get_current_user),
    db_session: AsyncSession = Depends(get_db)
):
    try:
        result = await db_session.execute(select(Demand).order_by(Demand.createdAt.desc()))
        demands = result.scalars().all()
        return [await format_demand(d, db_session) for d in demands]
    except Exception as e:
        print(f"CRITICAL ERROR in get_demands: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_demand(
    demand: DemandCreate,
    user: User = Depends(get_current_user),
    db_session: AsyncSession = Depends(get_db)
):
    try:
        due_date = parse_date(demand.due_date)

        new_demand = Demand(
            id=str(uuid.uuid4()),
            title=demand.title,
            description=demand.description,
            priority=demand.priority,
            status="pending",
            assignedTo=demand.assigned_to,
            createdBy=user.email,  # Usa email do usuário autenticado
            dueDate=due_date,
            createdAt=datetime.utcnow(),
            updatedAt=datetime.utcnow()
        )
        
        if demand.assigned_user_ids:
            users_res = await db_session.execute(select(User).where(User.id.in_(demand.assigned_user_ids)))
            new_demand.assignedUsers = users_res.scalars().all()

        db_session.add(new_demand)
        await db_session.commit()
        await db_session.refresh(new_demand)
        
        return await format_demand(new_demand, db_session)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"CRITICAL ERROR in create_demand: {e}")
        traceback.print_exc()
        await db_session.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}", status_code=status.HTTP_200_OK)
async def update_demand(
    id: str,
    update_data: DemandUpdate,
    user: User = Depends(get_current_user),
    db_session: AsyncSession = Depends(get_db)
):
    result = await db_session.execute(select(Demand).where(Demand.id == id))
    demand = result.scalar_one_or_none()
    
    if not demand:
        raise HTTPException(status_code=404, detail="Demand not found")
        
    data = update_data.dict(exclude_unset=True)
    
    if data.get("title"): demand.title = data["title"]
    if "description" in data: demand.description = data["description"]
    if data.get("priority"): demand.priority = data["priority"]
    if "status" in data and data["status"] is not None:
        old_status = demand.status
        demand.status = data["status"]
        if demand.status == "completed" and old_status != "completed":
            demand.completedAt = datetime.utcnow()
        elif demand.status != "completed":
            demand.completedAt = None
    if "assigned_to" in data: demand.assignedTo = data["assigned_to"]
    
    if "assigned_user_ids" in data and data["assigned_user_ids"] is not None:
        user_ids = data["assigned_user_ids"]
        if user_ids:
            users_res = await db_session.execute(select(User).where(User.id.in_(user_ids)))
            demand.assignedUsers = users_res.scalars().all()
        else:
            demand.assignedUsers = []

    if "due_date" in data:
        # null/"" remove o prazo
        demand.dueDate = parse_date(data["due_date"])
    if "completed_at" in data and data["completed_at"]:
        demand.completedAt = parse_date(data["completed_at"])

    demand.updatedAt = datetime.utcnow()
    
    await db_session.commit()
    await db_session.refresh(demand)
    
    return await format_demand(demand, db_session)

@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_demand(
    id: str,
    user: User = Depends(get_current_user),
    db_session: AsyncSession = Depends(get_db)
):
    result = await db_session.execute(delete(Demand).where(Demand.id == id))
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Demand not found")
    
    await db_session.commit()
    return {"message": "Success"}
