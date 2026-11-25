import re
from datetime import datetime, timezone
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



def parse_date(value: Any) -> Optional[datetime]:
    """
    Converte uma data vinda do frontend para datetime *naive* em UTC.

    Aceita "YYYY-MM-DD" e ISO 8601 com ou sem fuso ("...Z", "...-03:00").
    As colunas são DateTime sem timezone; um datetime com tzinfo faz o asyncpg
    falhar com "can't subtract offset-naive and offset-aware datetimes" (500).
    Retorna None para valores vazios; levanta ValueError para formato inválido.
    """
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        dt = value
    else:
        text = str(value).strip()
        try:
            dt = datetime.fromisoformat(text.replace("Z", "+00:00"))
        except ValueError:
            dt = datetime.strptime(text[:10], "%Y-%m-%d")
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt
