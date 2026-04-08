from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload, joinedload
from core.database_sql import get_db
from core.models_sql import (
    Demand, Ticket, Process, Project, FinanceTransaction, RegistryEntry
)
from datetime import datetime, timedelta

router = APIRouter()


# ────────────────────────────────────────────────────────
#  Helpers de mapeamento de status p/ formato canônico
# ────────────────────────────────────────────────────────

def normalize_status(raw: str) -> str:
    """Converte status de qualquer módulo para pending | in_progress | completed."""
    mapping = {
        # Demands
        "pending": "pending",
        "in_progress": "in_progress",
        "completed": "completed",
        # Tickets
        "open": "pending",
        "paused": "in_progress",
        "in_progress": "in_progress",
        "resolved": "completed",
        # Processes
        "open": "pending",
        "in_analysis": "in_progress",
        "closed": "completed",
        "archived": "completed",
        # Projects
        "planning": "pending",
        "active": "in_progress",
        "completed": "completed",
        "on_hold": "in_progress",
        "cancelled": "completed",
        # Financeiro
        "pending": "pending",
        "paid": "completed",
        "overdue": "pending",
        # Registro
        "PENDING": "pending",
        "COMPLETED": "completed",
        "APPROVED": "completed",
        "REJECTED": "completed",
    }
    return mapping.get((raw or "").lower(), "pending")


def normalize_priority(raw: str) -> str:
    """Converte prioridade de qualquer módulo para low | medium | high | critical."""
    mapping = {
        "low": "low",
        "baixa": "low",
        "medium": "medium",
        "media": "medium",
        "média": "medium",
        "high": "high",
        "alta": "high",
        "critical": "critical",
        "critica": "critical",
        "crítica": "critical",
        # Tickets usam maiúsculas
        "low": "low",
        "medium": "medium",
        "high": "high",
        "critical": "critical",
    }
    return mapping.get((raw or "").lower(), "medium")


# ────────────────────────────────────────────────────────
#  GET /api/dashboard/all-items
# ────────────────────────────────────────────────────────

@router.get("/all-items")
async def get_all_items(db_session: AsyncSession = Depends(get_db)):
    """
    Agrega itens de TODOS os setores num formato canônico:
    - Demandas Globais  (setor: geral)
    - Tickets de TI     (setor: ti)
    - Processos Jurídicos (setor: procuradoria)
    - Projetos de Comunicação (setor: comunicacao)
    """
    items = []

    # ── 1. Demandas Globais ──────────────────────────────
    result = await db_session.execute(
        select(Demand).options(selectinload(Demand.assignedUsers))
        .order_by(Demand.createdAt.desc())
    )
    demands = result.scalars().all()
    for d in demands:
        items.append({
            "id": d.id,
            "source": "demands",
            "sector": "geral",
            "sector_label": "Geral",
            "title": d.title,
            "description": d.description,
            "status": normalize_status(d.status),
            "status_raw": d.status,
            "priority": normalize_priority(d.priority),
            "priority_raw": d.priority,
            "due_date": d.dueDate.isoformat() if d.dueDate else None,
            "created_at": d.createdAt.isoformat() if d.createdAt else None,
            "updated_at": d.updatedAt.isoformat() if d.updatedAt else None,
            "completed_at": d.completedAt.isoformat() if d.completedAt else None,
            "assigned_users": [{"id": u.id, "name": u.name} for u in (d.assignedUsers or [])],
            "created_by": d.createdBy,
            "extra": {},
        })

    # ── 2. Tickets de TI ────────────────────────────────
    result = await db_session.execute(
        select(Ticket)
        .options(joinedload(Ticket.assignedTo), selectinload(Ticket.assignedUsers))
        .order_by(Ticket.createdAt.desc())
    )
    tickets = result.scalars().unique().all()
    for t in tickets:
        assigned = list(t.assignedUsers or [])
        if t.assignedTo and t.assignedTo not in assigned:
            assigned = [t.assignedTo] + assigned
        items.append({
            "id": t.id,
            "source": "tickets",
            "sector": "ti",
            "sector_label": "TI",
            "title": t.title,
            "description": t.description,
            "status": normalize_status(t.status),
            "status_raw": t.status,
            "priority": normalize_priority(t.priority),
            "priority_raw": t.priority,
            "due_date": None,
            "created_at": t.createdAt.isoformat() if t.createdAt else None,
            "updated_at": t.updatedAt.isoformat() if t.updatedAt else None,
            "completed_at": t.resolvedAt.isoformat() if t.resolvedAt else None,
            "assigned_users": [
                {"id": u.id, "name": u.name} if hasattr(u, 'id') else {"id": "", "name": str(u)}
                for u in assigned
            ],
            "created_by": t.requesterName,
            "extra": {
                "category": t.category,
                "sub_sector": t.subSector,
                "accumulated_time_ms": t.accumulatedTimeMs,
            },
        })

    # ── 3. Processos Jurídicos ───────────────────────────
    result = await db_session.execute(
        select(Process).order_by(Process.createdAt.desc())
    )
    processes = result.scalars().all()
    for p in processes:
        items.append({
            "id": p.id,
            "source": "processes",
            "sector": "procuradoria",
            "sector_label": "Procuradoria",
            "title": p.title,
            "description": p.description,
            "status": normalize_status(p.status),
            "status_raw": p.status,
            "priority": "medium",
            "priority_raw": "medium",
            "due_date": p.deadlineDate.isoformat() if p.deadlineDate else None,
            "created_at": p.createdAt.isoformat() if p.createdAt else None,
            "updated_at": p.updatedAt.isoformat() if p.updatedAt else None,
            "completed_at": None,
            "assigned_users": [],
            "created_by": None,
            "extra": {
                "process_number": p.processNumber,
                "party_name": p.partyName,
                "court": p.court,
            },
        })

    # ── 4. Projetos de Comunicação ───────────────────────
    result = await db_session.execute(
        select(Project)
        .options(selectinload(Project.assignedUsers))
        .order_by(Project.createdAt.desc())
    )
    projects = result.scalars().all()
    for proj in projects:
        items.append({
            "id": proj.id,
            "source": "projects",
            "sector": "comunicacao",
            "sector_label": "Comunicação",
            "title": proj.title,
            "description": proj.description,
            "status": normalize_status(proj.status),
            "status_raw": proj.status,
            "priority": normalize_priority(proj.priority),
            "priority_raw": proj.priority,
            "due_date": proj.endDate.isoformat() if proj.endDate else None,
            "created_at": proj.createdAt.isoformat() if proj.createdAt else None,
            "updated_at": proj.updatedAt.isoformat() if proj.updatedAt else None,
            "completed_at": None,
            "assigned_users": [{"id": u.id, "name": u.name} for u in (proj.assignedUsers or [])],
            "created_by": None,
            "extra": {
                "start_date": proj.startDate.isoformat() if proj.startDate else None,
            },
        })

    # ── 5. Financeiro ────────────────────────────────────
    finance_result = await db_session.execute(select(FinanceTransaction).order_by(FinanceTransaction.createdAt.desc()))
    for f in finance_result.scalars().all():
        items.append({
            "id": f.id,
            "source": "finance",
            "sector": "financeiro",
            "sector_label": "Financeiro",
            "title": f.description,
            "description": "",
            "status": "completed",
            "status_raw": f.status,
            "priority": "medium",
            "priority_raw": "medium",
            "due_date": f.date.isoformat() if f.date else None,
            "created_at": f.createdAt.isoformat() if f.createdAt else None,
            "updated_at": None,
            "completed_at": f.date.isoformat() if f.date else None,
            "assigned_users": [],
            "created_by": None,
            "extra": {
                "amount": float(f.amount) if f.amount else 0,
                "supplier": f.supplier,
            },
        })

    # ── 6. Registro ──────────────────────────────────────
    registry_result = await db_session.execute(select(RegistryEntry).order_by(RegistryEntry.createdAt.desc()))
    for r in registry_result.scalars().all():
        items.append({
            "id": r.id,
            "source": "registry",
            "sector": "registro",
            "sector_label": "Registro",
            "title": f"Protocolo: {r.protocolNumber}",
            "description": r.notes or "",
            "status": normalize_status(r.status),
            "status_raw": r.status,
            "priority": "medium",
            "priority_raw": "medium",
            "due_date": r.deadlineDate.isoformat() if r.deadlineDate else None,
            "created_at": r.createdAt.isoformat() if r.createdAt else None,
            "updated_at": None,
            "completed_at": None,
            "assigned_users": [],
            "created_by": None,
            "extra": {
                "protocol": r.protocolNumber,
                "document_type": r.documentType,
                "party_name": r.partyName,
            },
        })

    # Ordena tudo por data de criação desc
    items.sort(key=lambda x: x["created_at"] or "", reverse=True)
    return items


# ────────────────────────────────────────────────────────
#  GET /api/dashboard/metrics
# ────────────────────────────────────────────────────────

@router.get("/metrics")
async def get_dashboard_metrics(db_session: AsyncSession = Depends(get_db)):
    """
    Retorna métricas agregadas de TODOS os setores.
    """
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)

    # ── Demandas ──
    r = await db_session.execute(select(func.count()).select_from(Demand))
    d_total = r.scalar() or 0
    r = await db_session.execute(select(func.count()).select_from(Demand).where(Demand.status == "completed"))
    d_completed = r.scalar() or 0
    r = await db_session.execute(select(func.count()).select_from(Demand).where(Demand.status == "in_progress"))
    d_in_progress = r.scalar() or 0
    r = await db_session.execute(select(func.count()).select_from(Demand).where(Demand.status == "pending"))
    d_pending = r.scalar() or 0
    r = await db_session.execute(
        select(func.count()).select_from(Demand).where(Demand.dueDate < now, Demand.status != "completed")
    )
    d_overdue = r.scalar() or 0

    # ── Tickets ──
    r = await db_session.execute(select(func.count()).select_from(Ticket))
    t_total = r.scalar() or 0
    r = await db_session.execute(select(func.count()).select_from(Ticket).where(Ticket.status == "RESOLVED"))
    t_completed = r.scalar() or 0
    r = await db_session.execute(select(func.count()).select_from(Ticket).where(Ticket.status == "IN_PROGRESS"))
    t_in_progress = r.scalar() or 0
    r = await db_session.execute(select(func.count()).select_from(Ticket).where(Ticket.status == "OPEN"))
    t_pending = r.scalar() or 0

    # ── Processos ──
    r = await db_session.execute(select(func.count()).select_from(Process))
    p_total = r.scalar() or 0
    r = await db_session.execute(select(func.count()).select_from(Process).where(Process.status.in_(["CLOSED", "ARCHIVED"])))
    p_completed = r.scalar() or 0
    r = await db_session.execute(select(func.count()).select_from(Process).where(Process.status == "OPEN"))
    p_pending = r.scalar() or 0
    r = await db_session.execute(
        select(func.count()).select_from(Process).where(
            Process.deadlineDate < now, Process.status.notin_(["CLOSED", "ARCHIVED"])
        )
    )
    p_overdue = r.scalar() or 0

    # ── Projetos ──
    r = await db_session.execute(select(func.count()).select_from(Project))
    pr_total = r.scalar() or 0
    r = await db_session.execute(select(func.count()).select_from(Project).where(Project.status == "COMPLETED"))
    pr_completed = r.scalar() or 0
    r = await db_session.execute(select(func.count()).select_from(Project).where(Project.status == "ACTIVE"))
    pr_in_progress = r.scalar() or 0
    r = await db_session.execute(select(func.count()).select_from(Project).where(Project.status == "PLANNING"))
    pr_pending = r.scalar() or 0

    # ── Financeiro ──
    r = await db_session.execute(select(func.count()).select_from(FinanceTransaction))
    f_total = r.scalar() or 0

    # ── Registro ──
    r = await db_session.execute(select(func.count()).select_from(RegistryEntry))
    re_total = r.scalar() or 0

    # ── Totais agregados ──
    total = d_total + t_total + p_total + pr_total + f_total + re_total
    completed = d_completed + t_completed + p_completed + pr_completed
    in_progress = d_in_progress + t_in_progress + (p_total - p_completed - p_pending) + pr_in_progress
    pending = d_pending + t_pending + p_pending + pr_pending
    overdue = d_overdue + p_overdue
    completion_rate = round((completed / total * 100), 1) if total > 0 else 0.0

    # ── Tendência (últimos 30 dias — demandas globais como proxy) ──
    result_trend = await db_session.execute(
        select(Demand).where(Demand.createdAt >= thirty_days_ago).order_by(Demand.createdAt.asc())
    )
    trend_map: dict = {}
    for d in result_trend.scalars().all():
        day = d.createdAt.strftime("%d/%m") if d.createdAt else None
        if not day:
            continue
        if day not in trend_map:
            trend_map[day] = {"date": day, "total": 0, "completed": 0}
        trend_map[day]["total"] += 1
        if d.status == "completed":
            trend_map[day]["completed"] += 1

    return {
        "counts": {
            "total": total,
            "completed": completed,
            "in_progress": in_progress,
            "pending": pending,
            "overdue": overdue,
            "completion_rate": completion_rate,
            # breakdown por setor
            "by_sector": {
                "geral":       {"total": d_total, "completed": d_completed},
                "ti":          {"total": t_total, "completed": t_completed},
                "procuradoria":{"total": p_total, "completed": p_completed},
                "comunicacao": {"total": pr_total, "completed": pr_completed},
                "financeiro":  {"total": f_total, "completed": 0}, # Modificar se houver lógica de completos
                "registro":    {"total": re_total, "completed": 0}, # Modificar se houver lógica de completos
            },
        },
        "trend": list(trend_map.values()),
    }
