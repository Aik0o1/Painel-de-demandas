from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv()
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routes import auth, tickets, weekly_demands, projects, employees, inventory, finance, contracts, processes, registry, couchdb_registro, profiles, demands, sectors, admin, audit_logs, reports, it_reports, users

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

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


# CORS Policy equivalente ao cors.php anterior
origins = [
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "*"  # Substituir na produçao por rotas fixas
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Adiciona o router de autenticação e de tickets com os prefixos
app.include_router(auth.router, prefix="/api/auth", tags=["Autenticação"])
app.include_router(admin.router, prefix="/api/admin", tags=["Administração"])
app.include_router(audit_logs.router, prefix="/api/audit-logs", tags=["Auditoria"])
app.include_router(profiles.router, prefix="/api/profile", tags=["Perfis"])
app.include_router(profiles.router, prefix="/api/profiles", tags=["Perfis"]) # Suporte a plural
app.include_router(sectors.router, prefix="/api/sectors", tags=["Setores"]) # Novo
app.include_router(demands.router, prefix="/api/demands", tags=["Menu - Demandas Globais"])
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

# Servir arquivos estáticos (Uploads)
import os
os.makedirs("uploads/avatars", exist_ok=True)
os.makedirs("uploads/documents", exist_ok=True)
os.makedirs("uploads/it_reports", exist_ok=True)
app.mount("/api/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def read_root():
    return {"message": "API FastAPI (Demand Navigator) rodando perfeitamente."}

