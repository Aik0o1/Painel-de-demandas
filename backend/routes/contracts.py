from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from core.database_sql import get_db
from core.models_sql import User, Contract
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

class ContractCreate(BaseModel):
    title: str
    supplier: str
    value: float
    contract_number: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    sector_id: Optional[str] = None
    status: str = "ACTIVE"

class ContractUpdate(BaseModel):
    title: Optional[str] = None
    supplier: Optional[str] = None
    value: Optional[float] = None
    contract_number: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    sector_id: Optional[str] = None
    status: Optional[str] = None

def format_contract(contract: Contract):
    return {
        "id": contract.id,
        "title": contract.title,
        "supplier": contract.supplier,
        "value": contract.value,
        "contract_number": contract.contractNumber,
        "start_date": contract.startDate.isoformat() if contract.startDate else None,
        "end_date": contract.endDate.isoformat() if contract.endDate else None,
        "sector_id": contract.sectorId,
        "status": contract.status,
        "createdAt": contract.createdAt.isoformat() if contract.createdAt else None,
        "updatedAt": contract.updatedAt.isoformat() if contract.updatedAt else None
    }

@router.get("", status_code=status.HTTP_200_OK)
async def get_contracts(user: User = Depends(get_current_user), db_session: AsyncSession = Depends(get_db)):
    result = await db_session.execute(select(Contract).order_by(Contract.createdAt.desc()))
    contracts = result.scalars().all()
    return [format_contract(c) for c in contracts]

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_contract(contract: ContractCreate, user: User = Depends(check_permission("financeira", "create")), db_session: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    new_contract = Contract(
        id=str(uuid.uuid4()),
        title=contract.title,
        supplier=contract.supplier,
        value=contract.value,
        contractNumber=contract.contract_number,
        startDate=parse_date(contract.start_date),
        endDate=parse_date(contract.end_date),
        sectorId=contract.sector_id,
        status=contract.status,
        createdAt=now,
        updatedAt=now,
    )
    db_session.add(new_contract)
    await db_session.commit()
    await db_session.refresh(new_contract)
    return format_contract(new_contract)

@router.put("/{id}", status_code=status.HTTP_200_OK)
async def update_contract(id: str, update_data: ContractUpdate, user: User = Depends(check_permission("financeira", "update")), db_session: AsyncSession = Depends(get_db)):
    result = await db_session.execute(select(Contract).where(Contract.id == id))
    contract = result.scalar_one_or_none()
    
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
        
    data = update_data.dict(exclude_unset=True)
    if "title" in data: contract.title = data["title"]
    if "supplier" in data: contract.supplier = data["supplier"]
    if "value" in data: contract.value = data["value"]
    if "contract_number" in data: contract.contractNumber = data["contract_number"]
    if "start_date" in data: contract.startDate = parse_date(data["start_date"])
    if "end_date" in data: contract.endDate = parse_date(data["end_date"])
    if "sector_id" in data: contract.sectorId = data["sector_id"]
    if "status" in data: contract.status = data["status"]
    
    contract.updatedAt = datetime.utcnow()
    await db_session.commit()
    await db_session.refresh(contract)
    return format_contract(contract)

@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_contract(id: str, user: User = Depends(check_permission("financeira", "delete")), db_session: AsyncSession = Depends(get_db)):
    result = await db_session.execute(delete(Contract).where(Contract.id == id))
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Contract not found")
    await db_session.commit()
    return {"message": "Contract deleted"}
