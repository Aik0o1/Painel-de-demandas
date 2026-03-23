from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from core.database_sql import get_db
from core.models_sql import User, Employee
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

class EmployeeCreate(BaseModel):
    full_name: str
    position: str
    department: str
    admission_date: Optional[str] = None
    status: str = "ACTIVE"

class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    admission_date: Optional[str] = None
    status: Optional[str] = None

def format_employee(emp: Employee):
    return {
        "id": emp.id,
        "full_name": emp.fullName,
        "position": emp.position,
        "department": emp.department,
        "admission_date": emp.admissionDate.isoformat() if emp.admissionDate else None,
        "status": emp.status,
        "createdAt": emp.createdAt.isoformat() if emp.createdAt else None,
        "updatedAt": emp.updatedAt.isoformat() if emp.updatedAt else None
    }

@router.get("", status_code=status.HTTP_200_OK)
async def get_employees(user: User = Depends(get_current_user), db_session: AsyncSession = Depends(get_db)):
    result = await db_session.execute(select(Employee).order_by(Employee.createdAt.desc()))
    employees = result.scalars().all()
    return [format_employee(e) for e in employees]

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_employee(emp: EmployeeCreate, user: User = Depends(check_permission("administrativo", "create")), db_session: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    new_emp = Employee(
        id=str(uuid.uuid4()),
        fullName=emp.full_name,
        position=emp.position,
        department=emp.department,
        admissionDate=parse_date(emp.admission_date),
        status=emp.status,
        createdAt=now,
        updatedAt=now,
    )
    db_session.add(new_emp)
    await db_session.commit()
    await db_session.refresh(new_emp)
    return format_employee(new_emp)

@router.put("/{id}", status_code=status.HTTP_200_OK)
async def update_employee(id: str, update_data: EmployeeUpdate, user: User = Depends(check_permission("administrativo", "update")), db_session: AsyncSession = Depends(get_db)):
    result = await db_session.execute(select(Employee).where(Employee.id == id))
    employee = result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    data = update_data.dict(exclude_unset=True)
    if "full_name" in data: employee.fullName = data["full_name"]
    if "position" in data: employee.position = data["position"]
    if "department" in data: employee.department = data["department"]
    if "admission_date" in data: employee.admissionDate = parse_date(data["admission_date"])
    if "status" in data: employee.status = data["status"]
    
    employee.updatedAt = datetime.utcnow()
    await db_session.commit()
    await db_session.refresh(employee)
    return format_employee(employee)

@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_employee(id: str, user: User = Depends(check_permission("administrativo", "delete")), db_session: AsyncSession = Depends(get_db)):
    result = await db_session.execute(delete(Employee).where(Employee.id == id))
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
    await db_session.commit()
    return {"message": "Employee deleted"}
