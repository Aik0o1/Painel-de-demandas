import re
from datetime import datetime
from typing import Any, Optional

# Funções utilitárias genéricas
def format_datetime(dt: Any) -> Optional[str]:

    if isinstance(dt, datetime):
        return dt.isoformat()
    return str(dt) if dt else None

def sanitize_html(text: Any) -> Any:
    """Remove tags HTML básicas para evitar XSS persistente."""
    if not isinstance(text, str):
        return text
    # Remove qualquer tag HTML <...>
    clean = re.compile('<.*?>')
    return re.sub(clean, '', text)

