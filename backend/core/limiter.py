import os

import jwt
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request


def rate_limit_key(request: Request) -> str:
    """
    Chave do rate limit por usuário.

    Todas as requisições chegam ao FastAPI pelo proxy do Next.js, então o IP da
    conexão é sempre o do container do frontend: com get_remote_address todos
    os usuários dividiam o mesmo contador ("20 per 1 minute" para o sistema
    inteiro). Usamos o e-mail do JWT e, sem token, o IP original do cliente.
    """
    auth = request.headers.get("authorization") or ""
    if auth.startswith("Bearer "):
        try:
            payload = jwt.decode(
                auth.split(" ", 1)[1], os.getenv("NEXTAUTH_SECRET"), algorithms=["HS256"]
            )
            if payload.get("email"):
                return f"user:{payload['email']}"
        except jwt.PyJWTError:
            pass

    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return f"ip:{forwarded.split(',')[0].strip()}"
    return f"ip:{get_remote_address(request)}"


limiter = Limiter(key_func=rate_limit_key)
