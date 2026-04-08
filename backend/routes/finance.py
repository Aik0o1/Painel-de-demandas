from fastapi import APIRouter, HTTPException, status, Query, File, UploadFile, Form, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os
import shutil
import json
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from core.database_sql import get_db
from core.models_sql import User, BudgetCategory, FinanceTransaction
from core.security import get_current_user, check_permission

router = APIRouter()

# --- Pydantic Models ---
class BudgetCategoryUpdate(BaseModel):
    id: str
    total_allocated: float

def format_category(cat: BudgetCategory, spent: float = 0.0):
    return {
        "id": cat.id,
        "name": cat.name,
        "total_allocated": cat.totalAllocated,
        "spent": spent,
        "remaining": float(cat.totalAllocated or 0) - spent,
        "createdAt": cat.createdAt.isoformat() if cat.createdAt else None,
        "updatedAt": cat.updatedAt.isoformat() if cat.updatedAt else None
    }

def format_transaction(tx: FinanceTransaction, category: Optional[BudgetCategory] = None):
    return {
        "id": tx.id,
        "description": tx.description,
        "amount": tx.amount,
        "date": tx.date.isoformat() if tx.date else None,
        "supplier": tx.supplier,
        "status": tx.status,
        "attachment_url": tx.attachmentUrl,
        "category_id": tx.categoryId,
        "category": {
            "id": category.id,
            "name": category.name
        } if category else None,
        "beneficiaries": tx.beneficiaries,
        "passenger": tx.passenger,
        "route": tx.route,
        "createdAt": tx.createdAt.isoformat() if tx.createdAt else None
    }

# --- Budget Categories Routes ---
@router.get("/budget-categories", status_code=status.HTTP_200_OK)
async def get_budget_categories(db_session: AsyncSession = Depends(get_db)):
    result = await db_session.execute(select(BudgetCategory))
    categories = result.scalars().all()
    
    formatted_categories = []
    for cat in categories:
        # Sum spent for this category
        spent_result = await db_session.execute(
            select(func.sum(FinanceTransaction.amount)).where(FinanceTransaction.categoryId == cat.id)
        )
        spent = spent_result.scalar() or 0.0
        formatted_categories.append(format_category(cat, float(spent)))
        
    return formatted_categories

@router.put("/budget-categories", status_code=status.HTTP_200_OK)
async def update_budget_category(data: BudgetCategoryUpdate, user: User = Depends(check_permission("financeira", "update")), db_session: AsyncSession = Depends(get_db)):
    result = await db_session.execute(select(BudgetCategory).where(BudgetCategory.id == data.id))
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    category.totalAllocated = data.total_allocated
    category.updatedAt = datetime.utcnow()
    
    await db_session.commit()
    await db_session.refresh(category)
    return format_category(category)

# --- Payments Routes ---
@router.get("/payments", status_code=status.HTTP_200_OK)
async def get_payments(page: int = 1, limit: int = 10, status_filter: Optional[str] = Query(None, alias="status"), db_session: AsyncSession = Depends(get_db)):
    skip = (page - 1) * limit
    
    query = select(FinanceTransaction)
    if status_filter and hasattr(FinanceTransaction, 'status'):
        query = query.where(FinanceTransaction.status == status_filter)

    result = await db_session.execute(
        query.order_by(FinanceTransaction.date.desc()).offset(skip).limit(limit)
    )
    transactions = result.scalars().all()
    
    count_query = select(func.count(FinanceTransaction.id))
    if status_filter and hasattr(FinanceTransaction, 'status'):
        count_query = count_query.where(FinanceTransaction.status == status_filter)
        
    count_result = await db_session.execute(count_query)
    total = count_result.scalar() or 0
    
    data = []
    for tx in transactions:
        # Get category if exists
        cat = None
        if tx.categoryId:
            cat_result = await db_session.execute(select(BudgetCategory).where(BudgetCategory.id == tx.categoryId))
            cat = cat_result.scalar_one_or_none()
        data.append(format_transaction(tx, cat))
        
    return {
        "success": True,
        "count": len(data),
        "total": total,
        "page": page,
        "totalPages": (total + limit - 1) // limit if limit > 0 else 1,
        "data": data
    }

@router.post("/payments", status_code=status.HTTP_201_CREATED)
async def create_payment(
    description: str = Form(...),
    amount: float = Form(...),
    date: str = Form(...),
    supplier: str = Form(...),
    category_id: str = Form(...),
    file: Optional[UploadFile] = File(None),
    beneficiaries: Optional[str] = Form(None),
    passenger: Optional[str] = Form(None),
    route: Optional[str] = Form(None),
    user: User = Depends(check_permission("financeira", "create")),
    db_session: AsyncSession = Depends(get_db)
):
    try:
        if "T" in date:
            parsed_date = datetime.fromisoformat(date.replace("Z", "+00:00"))
        else:
            parsed_date = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Data inválida")

    attachment_url = ""
    if file and file.filename:
        os.makedirs("uploads", exist_ok=True)
        safe_filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join("uploads", safe_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        attachment_url = f"/api/uploads/{safe_filename}"
        
    parsed_beneficiaries = None
    if beneficiaries:
        try:
            parsed_beneficiaries = json.loads(beneficiaries)
        except:
            parsed_beneficiaries = [b.strip() for b in beneficiaries.split(",")]

    now = datetime.utcnow()
    new_tx = FinanceTransaction(
        id=str(uuid.uuid4()),
        description=description,
        amount=amount,
        date=parsed_date,
        supplier=supplier,
        status="pending",
        attachmentUrl=attachment_url,
        categoryId=category_id,
        beneficiaries=parsed_beneficiaries,
        passenger=passenger,
        route=route,
        createdAt=now
    )
    
    db_session.add(new_tx)
    await db_session.commit()
    await db_session.refresh(new_tx)
    
    # Get category for formatting
    cat_res = await db_session.execute(select(BudgetCategory).where(BudgetCategory.id == category_id))
    cat = cat_res.scalar_one_or_none()
    
    return {"success": True, "data": format_transaction(new_tx, cat)}

@router.put("/payments/{id}", status_code=status.HTTP_200_OK)
async def update_payment(
    id: str,
    description: Optional[str] = Form(None),
    amount: Optional[float] = Form(None),
    date: Optional[str] = Form(None),
    supplier: Optional[str] = Form(None),
    category_id: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    beneficiaries: Optional[str] = Form(None),
    passenger: Optional[str] = Form(None),
    route: Optional[str] = Form(None),
    status_updated: Optional[str] = Form(None, alias="status"),
    user: User = Depends(check_permission("financeira", "update")),
    db_session: AsyncSession = Depends(get_db)
):
    result = await db_session.execute(select(FinanceTransaction).where(FinanceTransaction.id == id))
    tx = result.scalar_one_or_none()
    
    if not tx:
        raise HTTPException(status_code=404, detail="Payment not found")
        
    if description is not None: tx.description = description
    if amount is not None: tx.amount = amount
    if date is not None:
        try:
            if "T" in date:
                tx.date = datetime.fromisoformat(date.replace("Z", "+00:00"))
            else:
                tx.date = datetime.strptime(date, "%Y-%m-%d")
        except ValueError:
            pass
            
    if supplier is not None: tx.supplier = supplier
    if category_id is not None: tx.categoryId = category_id
            
    if file and file.filename:
        safe_filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join("uploads", safe_filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        tx.attachmentUrl = f"/api/uploads/{safe_filename}"
        
    if beneficiaries is not None:
        try:
            tx.beneficiaries = json.loads(beneficiaries)
        except:
            tx.beneficiaries = [b.strip() for b in beneficiaries.split(",")]
            
    if passenger is not None: tx.passenger = passenger
    if route is not None: tx.route = route
    if status_updated is not None: tx.status = status_updated
    
    await db_session.commit()
    await db_session.refresh(tx)
    
    # Get category for formatting
    cat_res = await db_session.execute(select(BudgetCategory).where(BudgetCategory.id == tx.categoryId))
    cat = cat_res.scalar_one_or_none()
    
    return {"success": True, "data": format_transaction(tx, cat)}
