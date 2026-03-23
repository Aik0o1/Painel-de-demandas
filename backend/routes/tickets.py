from fastapi import APIRouter, HTTPException, status, Query, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from core.database_sql import get_db
from core.models_sql import User, Ticket
from core.security import get_current_user, check_permission
import uuid

router = APIRouter()

# Pydantic Models for Validation
class TicketCreate(BaseModel):
    title: str
    description: Optional[str] = None
    requester_name: Optional[str] = "Usuário"
    priority: str = "MEDIUM"
    category: str
    sub_sector: str = "support"

class TicketUpdate(BaseModel):
    status: str
    pause_reason: Optional[str] = None

def format_ticket(ticket: Ticket):
    return {
        "id": ticket.id,
        "title": ticket.title,
        "description": ticket.description,
        "requester_name": ticket.requesterName,
        "priority": ticket.priority,
        "category": ticket.category,
        "sub_sector": ticket.subSector,
        "status": ticket.status,
        "accumulated_time_ms": ticket.accumulatedTimeMs,
        "last_started_at": ticket.lastStartedAt.isoformat() if ticket.lastStartedAt else None,
        "pause_reason": ticket.pauseReason,
        "resolved_at": ticket.resolvedAt.isoformat() if ticket.resolvedAt else None,
        "createdAt": ticket.createdAt.isoformat() if ticket.createdAt else None,
        "updatedAt": ticket.updatedAt.isoformat() if ticket.updatedAt else None
    }

@router.get("", status_code=status.HTTP_200_OK)
async def get_tickets(
    sub_sector: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db_session: AsyncSession = Depends(get_db)
):
    query = select(Ticket)
    if sub_sector:
        query = query.where(Ticket.subSector == sub_sector)
    
    result = await db_session.execute(query.order_by(Ticket.createdAt.desc()))
    tickets = result.scalars().all()
    return [format_ticket(t) for t in tickets]

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_ticket(
    ticket: TicketCreate,
    current_user: User = Depends(check_permission("ti", "create")),
    db_session: AsyncSession = Depends(get_db)
):
    now = datetime.utcnow()
    new_ticket = Ticket(
        id=str(uuid.uuid4()),
        title=ticket.title,
        description=ticket.description,
        requesterName=ticket.requester_name,
        priority=ticket.priority,
        category=ticket.category,
        subSector=ticket.sub_sector,
        status="OPEN",
        accumulatedTimeMs=0,
        createdAt=now,
        updatedAt=now
    )
    
    db_session.add(new_ticket)
    await db_session.commit()
    await db_session.refresh(new_ticket)
    return format_ticket(new_ticket)

@router.patch("/{id}", status_code=status.HTTP_200_OK)
async def update_ticket(
    id: str, 
    update_data: TicketUpdate,
    current_user: User = Depends(check_permission("ti", "update")),
    db_session: AsyncSession = Depends(get_db)
):
    result = await db_session.execute(select(Ticket).where(Ticket.id == id))
    ticket = result.scalar_one_or_none()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    now = datetime.utcnow()
    new_status = update_data.status
    
    if new_status == 'IN_PROGRESS':
        if ticket.status in ['OPEN', 'PAUSED']:
            ticket.status = 'IN_PROGRESS'
            ticket.lastStartedAt = now
            ticket.pauseReason = "" 
            
    elif new_status == 'PAUSED':
        if ticket.status == 'IN_PROGRESS' and ticket.lastStartedAt:
            diff = int((now - ticket.lastStartedAt).total_seconds() * 1000)
            ticket.accumulatedTimeMs += diff
            ticket.status = 'PAUSED'
            ticket.lastStartedAt = None
            ticket.pauseReason = update_data.pause_reason or "Pausa solicitada sem motivo."
            
    elif new_status == 'RESOLVED':
        if ticket.status == 'IN_PROGRESS' and ticket.lastStartedAt:
            diff = int((now - ticket.lastStartedAt).total_seconds() * 1000)
            ticket.accumulatedTimeMs += diff
            
        ticket.status = 'RESOLVED'
        ticket.lastStartedAt = None
        ticket.resolvedAt = now

    ticket.updatedAt = now
    
    await db_session.commit()
    await db_session.refresh(ticket)
    return format_ticket(ticket)
