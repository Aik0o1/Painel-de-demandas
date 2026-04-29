from fastapi import FastAPI
from dotenv import load_dotenv
import os

load_dotenv()
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routes import auth, tickets, weekly_demands, projects, employees, inventory, finance, contracts, processes, registry, couchdb_registro, profiles, demands, sectors, admin, audit_logs, reports, it_reports, users, dashboard, uploads

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from core.limiter import limiter

class NormalizeTrailingSlashMiddleware(BaseHTTPMiddleware):
    """Remove barra final do path para evitar o 307 redirect que dropa o POST body."""
    async def dispatch(self, request: Request, call_next):
        scope = request.scope
        path = scope.get("path", "")
        # Remove trailing slash exceto da raiz "/"
        if path != "/" and path.endswith("/"):
            scope["path"] = path.rstrip("/")
            scope["raw_path"] = scope["path"].encode("utf-8")
        return await call_next(request)

app = FastAPI(
    title="Demand Navigator API",
    description="API em FastAPI servindo os mesmos dados do portal NextJS",
    version="1.0.0"
)

app.add_middleware(NormalizeTrailingSlashMiddleware)


# CORS Policy restrita conforme auditoria SEC-01
target_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,https://painel.jucepi.pi.gov.br")
origins = [o.strip() for o in target_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-User-Email"],
    expose_headers=["Content-Disposition"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Middleware de Headers de Segurança (SEC-07)
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' http://localhost:8080 http://127.0.0.1:8080;"
    return response


# Adiciona o router de autenticação e de tickets com os prefixos
app.include_router(auth.router, prefix="/api/auth", tags=["Autenticação"])
app.include_router(admin.router, prefix="/api/admin", tags=["Administração"])
app.include_router(audit_logs.router, prefix="/api/audit-logs", tags=["Auditoria"])
app.include_router(profiles.router, prefix="/api/profile", tags=["Perfis"])
app.include_router(profiles.router, prefix="/api/profiles", tags=["Perfis"]) # Suporte a plural
app.include_router(sectors.router, prefix="/api/sectors", tags=["Setores"]) # Novo
app.include_router(demands.router, prefix="/api/demands", tags=["Menu - Demandas Globais"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Painel - Métricas"])
app.include_router(tickets.router, prefix="/api/tickets", tags=["TI - Demandas"])
app.include_router(weekly_demands.router, prefix="/api/weekly-demands", tags=["Comunicação - Demandas Semanais"])
app.include_router(projects.router, prefix="/api/projects", tags=["Comunicação - Projetos"])
app.include_router(employees.router, prefix="/api/employees", tags=["Administrativa - Servidores"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["Administrativa - Inventário"])
app.include_router(finance.router, prefix="/api/finance", tags=["Financeiro - Pagamentos e Orçamento"])
app.include_router(contracts.router, prefix="/api/contracts", tags=["Financeiro - Contratos"])
app.include_router(processes.router, prefix="/api/processes", tags=["Procuradoria - Processos"])
app.include_router(registry.router, prefix="/api/registry", tags=["Registro Empresarial"])
app.include_router(couchdb_registro.router, prefix="/api/couchdb/registro", tags=["CouchDB - Registro Empresarial"])
app.include_router(reports.router, prefix="/api/reports", tags=["Exportação de Dados"])
app.include_router(it_reports.router, prefix="/api/it-reports", tags=["TI - Relatórios"])
app.include_router(users.router, prefix="/api/users", tags=["Usuários"])
app.include_router(uploads.router, prefix="/api/uploads", tags=["Uploads"])

# Servir arquivos estáticos (Uploads)
import os
os.makedirs("uploads/avatars", exist_ok=True)
os.makedirs("uploads/documents", exist_ok=True)
os.makedirs("uploads/it_reports", exist_ok=True)
# app.mount("/api/uploads", StaticFiles(directory="uploads"), name="uploads") # Desativado SEC-01

@app.get("/")
def read_root():
    return {"message": "API FastAPI (Demand Navigator) rodando perfeitamente."}

