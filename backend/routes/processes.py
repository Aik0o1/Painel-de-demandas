from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from core.database_sql import get_db
from core.models_sql import User, Process
from core.security import get_current_user, check_permission
import uuid

router = APIRouter()

def parse_date(v: Optional[str]) -> Optional[datetime]:
    if not v:
        return None
    try:
        if "T" in v:
            return datetime.fromisoformat(v.replace("Z", "+00:00"))
        return datetime.strptime(v, "%Y-%m-%d")
    except (ValueError, TypeError):
        return None

class ProcessCreate(BaseModel):
    process_number: str
    title: str
    party_name: Optional[str] = None
    court: Optional[str] = None
    deadline_date: Optional[str] = None
    status: str = "OPEN"
    description: Optional[str] = None

class ProcessUpdate(BaseModel):
    process_number: Optional[str] = None
    title: Optional[str] = None
    party_name: Optional[str] = None
    court: Optional[str] = None
    deadline_date: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None

def format_process(p: Process):
    return {
        "id": p.id,
        "process_number": p.processNumber,
        "title": p.title,
        "party_name": p.partyName,
        "court": p.court,
        "deadline_date": p.deadlineDate.isoformat() if p.deadlineDate else None,
        "status": p.status,
        "description": p.description,
        "createdAt": p.createdAt.isoformat() if p.createdAt else None,
        "updatedAt": p.updatedAt.isoformat() if p.updatedAt else None
    }

@router.get("", status_code=status.HTTP_200_OK)
async def get_processes(user: User = Depends(get_current_user), db_session: AsyncSession = Depends(get_db)):
    result = await db_session.execute(select(Process).order_by(Process.createdAt.desc()))
    processes = result.scalars().all()
    return [format_process(p) for p in processes]

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_process(process: ProcessCreate, user: User = Depends(check_permission("procuradoria", "create")), db_session: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    new_process = Process(
        id=str(uuid.uuid4()),
        processNumber=process.process_number,
        title=process.title,
        partyName=process.party_name,
        court=process.court,
        deadlineDate=parse_date(process.deadline_date),
        status=process.status,
        description=process.description,
        createdAt=now,
        updatedAt=now,
    )
    db_session.add(new_process)
    await db_session.commit()
    await db_session.refresh(new_process)
    return format_process(new_process)

@router.put("/{id}", status_code=status.HTTP_200_OK)
async def update_process(id: str, update_data: ProcessUpdate, user: User = Depends(check_permission("procuradoria", "update")), db_session: AsyncSession = Depends(get_db)):
    result = await db_session.execute(select(Process).where(Process.id == id))
    process = result.scalar_one_or_none()
    
    if not process:
        raise HTTPException(status_code=404, detail="Process not found")
        
    data = update_data.dict(exclude_unset=True)
    if "process_number" in data: process.processNumber = data["process_number"]
    if "title" in data: process.title = data["title"]
    if "party_name" in data: process.partyName = data["party_name"]
    if "court" in data: process.court = data["court"]
    if "deadline_date" in data: process.deadlineDate = parse_date(data["deadline_date"])
    if "status" in data: process.status = data["status"]
    if "description" in data: process.description = data["description"]
    
    process.updatedAt = datetime.utcnow()
    await db_session.commit()
    await db_session.refresh(process)
    return format_process(process)

@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_process(id: str, user: User = Depends(check_permission("procuradoria", "delete")), db_session: AsyncSession = Depends(get_db)):
    result = await db_session.execute(delete(Process).where(Process.id == id))
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Process not found")
    await db_session.commit()
    return {"message": "Process deleted successfully"}
