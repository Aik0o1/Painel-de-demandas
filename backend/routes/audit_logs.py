from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from core.database_sql import get_db
from core.models_sql import User, AuditLog
from datetime import datetime
from core.security import get_current_user
import os

router = APIRouter()

@router.get("", status_code=status.HTTP_200_OK)
async def list_audit_logs(user: User = Depends(get_current_user), db_session: AsyncSession = Depends(get_db)):
    # Limit to Master Admin or users with admin read permission
    if user.role != "MASTER_ADMIN" and not (user.permissions or {}).get("admin", {}).get("read"):
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    """Lista logs de auditoria do sistema."""
    try:
        result = await db_session.execute(select(AuditLog).order_by(AuditLog.createdAt.desc()).limit(500))
        logs = result.scalars().all()
        
        formatted_logs = []
        for log in logs:
            formatted_logs.append({
                "id": log.id,
                "action": log.action,
                "module": log.module,
                "description": log.description,
                "createdAt": log.createdAt.isoformat() if log.createdAt else None,
                "ipAddress": log.ipAddress,
                "userAgent": log.userAgent,
                "userName": log.userName,
                "userEmail": log.userEmail,
                "metadata": log.metadata_json
            })
            
        return formatted_logs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar logs: {str(e)}")
