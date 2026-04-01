from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from core.database_sql import get_db
from core.models_sql import User, Project, Sector
from sqlalchemy.orm import selectinload
from sqlalchemy import select, update, delete, func
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

class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "MEDIUM"
    status: str = "PLANNING"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    assigned_to: Optional[List[str]] = None

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    assigned_to: Optional[List[str]] = None

def format_project(proj: Project):
    return {
        "id": proj.id,
        "title": proj.title,
        "description": proj.description,
        "priority": proj.priority,
        "status": proj.status,
        "start_date": proj.startDate.isoformat() if proj.startDate else None,
        "end_date": proj.endDate.isoformat() if proj.endDate else None,
        "assigned_to": [u.id for u in proj.assignedUsers] if hasattr(proj, 'assignedUsers') else [],
        "assigned_users": [{"id": u.id, "name": u.name} for u in proj.assignedUsers] if hasattr(proj, 'assignedUsers') else [],
        "createdAt": proj.createdAt.isoformat() if proj.createdAt else None,
        "updatedAt": proj.updatedAt.isoformat() if proj.updatedAt else None
    }

@router.get("/users", status_code=status.HTTP_200_OK)
async def get_comunicacao_users(user: User = Depends(get_current_user), db_session: AsyncSession = Depends(get_db)):
    """Retorna os usuários que pertencem ao setor de comunicação."""
    sector_result = await db_session.execute(select(Sector).where(Sector.slug == "comunicacao"))
    sector = sector_result.scalar_one_or_none()
    
    if not sector:
        sector_result = await db_session.execute(select(Sector).where(func.lower(Sector.name).contains("comunicação")))
        sector = sector_result.scalar_one_or_none()
        
    if not sector:
        return []
        
    users_result = await db_session.execute(select(User).where(User.sectorId == sector.id))
    users = users_result.scalars().all()
    return [{"id": u.id, "name": u.name} for u in users]

@router.get("", status_code=status.HTTP_200_OK)
async def get_projects(user: User = Depends(get_current_user), db_session: AsyncSession = Depends(get_db)):
    result = await db_session.execute(
        select(Project)
        .options(selectinload(Project.assignedUsers))
        .order_by(Project.createdAt.desc())
    )
    projects = result.scalars().all()
    return [format_project(p) for p in projects]

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_project(project: ProjectCreate, user: User = Depends(check_permission("comunicacao", "create")), db_session: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    new_project = Project(
        id=str(uuid.uuid4()),
        title=project.title,
        description=project.description,
        priority=project.priority,
        status=project.status,
        startDate=parse_date(project.start_date),
        endDate=parse_date(project.end_date),
        createdAt=now,
        updatedAt=now,
    )
    
    if project.assigned_to:
        users_result = await db_session.execute(select(User).where(User.id.in_(project.assigned_to)))
        new_project.assignedUsers = users_result.scalars().all()
        
    db_session.add(new_project)
    await db_session.commit()
    await db_session.refresh(new_project)
    return format_project(new_project)

@router.put("/{id}", status_code=status.HTTP_200_OK)
async def update_project(id: str, update_data: ProjectUpdate, user: User = Depends(check_permission("comunicacao", "update")), db_session: AsyncSession = Depends(get_db)):
    result = await db_session.execute(select(Project).where(Project.id == id))
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    data = update_data.dict(exclude_unset=True)
    if "title" in data: project.title = data["title"]
    if "description" in data: project.description = data["description"]
    if "priority" in data: project.priority = data["priority"]
    if "status" in data: project.status = data["status"]
    if "start_date" in data: project.startDate = parse_date(data["start_date"])
    if "end_date" in data: project.endDate = parse_date(data["end_date"])
    
    if "assigned_to" in data:
        if data["assigned_to"]:
            users_result = await db_session.execute(select(User).where(User.id.in_(data["assigned_to"])))
            project.assignedUsers = users_result.scalars().all()
        else:
            project.assignedUsers = []
    
    project.updatedAt = datetime.utcnow()
    await db_session.commit()
    await db_session.refresh(project)
    return format_project(project)

@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_project(id: str, user: User = Depends(check_permission("comunicacao", "delete")), db_session: AsyncSession = Depends(get_db)):
    result = await db_session.execute(delete(Project).where(Project.id == id))
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    await db_session.commit()
    return {"message": "Project deleted successfully"}
