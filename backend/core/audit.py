from sqlalchemy.ext.asyncio import AsyncSession
from core.models_sql import AuditLog
from datetime import datetime
from typing import Optional, Any
from fastapi import Request

async def log_action(
    db_session: AsyncSession,
    action: str,
    module: str,
    description: str,
    user_email: Optional[str] = None,
    user_name: Optional[str] = None,
    request: Optional[Request] = None,
    metadata: Optional[dict] = None
):
    """Cria um registro de log de auditoria no banco de dados."""
    ip_address = request.client.host if request and request.client else None
    user_agent = request.headers.get("user-agent") if request else None
    
    audit_log = AuditLog(
        action=action,
        module=module,
        description=description,
        userEmail=user_email,
        userName=user_name,
        ipAddress=ip_address,
        userAgent=user_agent,
        metadata_json=metadata,
        createdAt=datetime.utcnow()
    )
    
    db_session.add(audit_log)
    await db_session.commit()
