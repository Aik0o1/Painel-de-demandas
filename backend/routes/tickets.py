from fastapi import APIRouter, HTTPException, status, Query, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from sqlalchemy.orm import joinedload
from core.database_sql import get_db
from core.models_sql import User, Ticket, Sector, UserStatus
from core.security import get_current_user, check_permission
import uuid
import logging

router = APIRouter()

# Pydantic Models for Validation
class TicketCreate(BaseModel):
    title: str
    description: Optional[str] = None
    requester_name: Optional[str] = None
    priority: str = "MEDIUM"
    category: str
    sub_sector: str = "support"
    assigned_to_id: Optional[str] = None

class TicketUpdate(BaseModel):
    status: Optional[str] = None
    pause_reason: Optional[str] = None
    assigned_to_id: Optional[str] = None

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
        "assigned_to_id": ticket.assignedToId,
        "assigned_to": {
            "id": ticket.assignedTo.id,
            "name": ticket.assignedTo.name
        } if ticket.assignedTo else None,
        "accumulated_time_ms": ticket.accumulatedTimeMs,
        "last_started_at": ticket.lastStartedAt.isoformat() if ticket.lastStartedAt else None,
        "pause_reason": ticket.pauseReason,
        "resolved_at": ticket.resolvedAt.isoformat() if ticket.resolvedAt else None,
        "createdAt": ticket.createdAt.isoformat() if ticket.createdAt else None,
        "updatedAt": ticket.updatedAt.isoformat() if ticket.updatedAt else None
    }

@router.get("/ti-users", status_code=status.HTTP_200_OK)
async def get_ti_users(
    current_user: User = Depends(get_current_user),
    db_session: AsyncSession = Depends(get_db)
):
    """
    Retorna os usuários que pertencem ao setor de TI.
    Estratégias (em ordem de prioridade):
      1. Busca pelo slug = 'ti'
      2. Busca pelo nome (case-insensitive) contendo 'tecnologia' ou 'informacao'/'informação'
      3. Fallback: todos os usuários ATIVOS do sistema
    """
    logger = logging.getLogger(__name__)

    ti_sector = None

    # Estratégia 1: pelo slug
    result_slug = await db_session.execute(
        select(Sector).where(Sector.slug == "ti")
    )
    ti_sector = result_slug.scalar_one_or_none()

    # Estratégia 2: pelo nome (slug pode ser NULL no servidor)
    if not ti_sector:
        result_name = await db_session.execute(
            select(Sector).where(
                func.lower(Sector.name).contains("tecnologia")
            )
        )
        ti_sector = result_name.scalar_one_or_none()
        if ti_sector:
            logger.warning(f"[ti-users] Setor TI encontrado por nome, não por slug. sector_id={ti_sector.id}")

    # Estratégia 3: sem setor identificado - retorna todos os usuários ATIVOS
    if not ti_sector:
        logger.warning("[ti-users] Setor TI não encontrado nem por slug nem por nome. Retornando todos os usuários ativos.")
        result_all = await db_session.execute(
            select(User)
            .where(User.status == UserStatus.ACTIVE)
            .order_by(User.name.asc())
        )
        users = result_all.scalars().all()
        return [{"id": u.id, "name": u.name} for u in users]

    # Busca usuários do setor encontrado
    result = await db_session.execute(
        select(User)
        .where(User.sector_id == ti_sector.id)
        .order_by(User.name.asc())
    )
    users = result.scalars().all()

    # Se o setor existe mas não tem usuários vinculados, retorna todos os ativos
    if not users:
        logger.warning(f"[ti-users] Setor TI (id={ti_sector.id}) não tem usuários com sector_id vinculado. Retornando todos os usuários ativos.")
        result_all = await db_session.execute(
            select(User)
            .where(User.status == UserStatus.ACTIVE)
            .order_by(User.name.asc())
        )
        users = result_all.scalars().all()

    return [{"id": u.id, "name": u.name} for u in users]

@router.get("", status_code=status.HTTP_200_OK)
async def get_tickets(
    sub_sector: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db_session: AsyncSession = Depends(get_db)
):
    query = select(Ticket).options(joinedload(Ticket.assignedTo))
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
    # Se requester_name não for enviado, usa o nome do usuário logado
    requester = ticket.requester_name or current_user.name
    
    new_ticket = Ticket(
        id=str(uuid.uuid4()),
        title=ticket.title,
        description=ticket.description,
        requesterName=requester,
        priority=ticket.priority,
        category=ticket.category,
        subSector=ticket.sub_sector,
        assignedToId=ticket.assigned_to_id,
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
    result = await db_session.execute(
        select(Ticket).options(joinedload(Ticket.assignedTo)).where(Ticket.id == id)
    )
    ticket = result.scalar_one_or_none()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    now = datetime.utcnow()
    
    # Atualiza Status
    if update_data.status:
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

    # Atualiza Responsável
    if update_data.assigned_to_id is not None:
        # Se for string vazia ou "unassigned", remove o responsável
        if update_data.assigned_to_id == "" or update_data.assigned_to_id == "unassigned":
            ticket.assignedToId = None
        else:
            ticket.assignedToId = update_data.assigned_to_id

    ticket.updatedAt = now
    
    await db_session.commit()
    await db_session.refresh(ticket)
    return format_ticket(ticket)
