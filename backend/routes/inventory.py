from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from core.database_sql import get_db
from core.models_sql import User, InventoryItem
from core.security import get_current_user, check_permission
import uuid

router = APIRouter()

class InventoryCreate(BaseModel):
    code: str
    name: str
    category: str
    location: Optional[str] = None
    status: str = "GOOD"

class InventoryUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None

def format_item(item: InventoryItem):
    return {
        "id": item.id,
        "code": item.code,
        "name": item.name,
        "category": item.category,
        "location": item.location,
        "status": item.status,
        "createdAt": item.createdAt.isoformat() if item.createdAt else None,
        "updatedAt": item.updatedAt.isoformat() if item.updatedAt else None
    }

@router.get("", status_code=status.HTTP_200_OK)
async def get_inventory(user: User = Depends(get_current_user), db_session: AsyncSession = Depends(get_db)):
    result = await db_session.execute(select(InventoryItem).order_by(InventoryItem.createdAt.desc()))
    items = result.scalars().all()
    return [format_item(i) for i in items]

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_inventory(item: InventoryCreate, user: User = Depends(check_permission("administrativo", "create")), db_session: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    new_item = InventoryItem(
        id=str(uuid.uuid4()),
        code=item.code,
        name=item.name,
        category=item.category,
        location=item.location,
        status=item.status,
        createdAt=now,
        updatedAt=now
    )
    
    db_session.add(new_item)
    try:
        await db_session.commit()
        await db_session.refresh(new_item)
        return format_item(new_item)
    except Exception as e:
        await db_session.rollback()
        raise HTTPException(status_code=400, detail=f"Erro ao criar item (código duplicado?): {str(e)}")

@router.put("/{id}", status_code=status.HTTP_200_OK)
async def update_inventory(id: str, update_data: InventoryUpdate, user: User = Depends(check_permission("administrativo", "update")), db_session: AsyncSession = Depends(get_db)):
    result = await db_session.execute(select(InventoryItem).where(InventoryItem.id == id))
    item = result.scalar_one_or_none()
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    data = update_data.dict(exclude_unset=True)
    if "code" in data: item.code = data["code"]
    if "name" in data: item.name = data["name"]
    if "category" in data: item.category = data["category"]
    if "location" in data: item.location = data["location"]
    if "status" in data: item.status = data["status"]
    
    item.updatedAt = datetime.utcnow()
    
    await db_session.commit()
    await db_session.refresh(item)
    return format_item(item)

@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_inventory(id: str, user: User = Depends(check_permission("administrativo", "delete")), db_session: AsyncSession = Depends(get_db)):
    result = await db_session.execute(delete(InventoryItem).where(InventoryItem.id == id))
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Item not found")
        
    await db_session.commit()
    return {"message": "Item deleted"}
