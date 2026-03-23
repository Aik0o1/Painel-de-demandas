from datetime import datetime
from typing import Any

# Funções utilitárias genéricas
def format_datetime(dt: Any) -> str:
    if isinstance(dt, datetime):
        return dt.isoformat()
    return str(dt) if dt else None
