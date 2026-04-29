"""
fix_sector_slugs.py
Popula a coluna 'slug' da tabela sectors no banco de produção.
Requer DATABASE_URL definida no ambiente.
Execute: python fix_sector_slugs.py
"""
import os
import sys
from sqlalchemy import create_engine, text

# SECURITY FIX: Remove hardcoded credentials, require env var
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERRO CRÍTICO: Variável de ambiente DATABASE_URL não definida.")
    sys.exit(1)

# Remove driver async para usar driver síncrono
db_url = DATABASE_URL.replace("+asyncpg", "")

engine = create_engine(db_url)

SLUG_MAP = {
    # TI
    "Tecnologia da Informação": "ti",
    "Tecnologia da Informacao": "ti",
    "TI": "ti",

    # FINANCEIRA
    "Diretoria Financeira": "financeira",
    "Financeiro": "financeira",
    "Financeira": "financeira",

    # ADMINISTRATIVA
    "Diretoria Administrativa": "administrativa",
    "Administrativo": "administrativa",
    "Administrativa": "administrativa",

    # REGISTRO
    "Diretoria de Registro": "registro",
    "Registro": "registro",
    "Setor de Registro": "registro",

    # COMUNICACAO
    "Setor de Comunicação": "comunicacao",
    "Comunicação": "comunicacao",
    "Comunicacao": "comunicacao",
    "Comunicacao Social": "comunicacao",

    # PROCURADORIA
    "Procuradoria": "procuradoria",
    "Procuradoria Juridica": "procuradoria",

    # PRESIDENCIA
    "Presidência": "presidencia",
    "Presidencia": "presidencia",
}

print(f"Conectando ao banco de dados...")

with engine.connect() as conn:
    result = conn.execute(text("SELECT id, name, slug FROM sectors"))
    sectors = result.fetchall()

    if not sectors:
        print("⚠️  Nenhum setor encontrado na tabela 'sectors'.")
    else:
        print(f"Setores encontrados: {len(sectors)}")
        updated = 0
        for row in sectors:
            sid, name, current_slug = row
            new_slug = SLUG_MAP.get(name)
            if new_slug and current_slug != new_slug:
                conn.execute(
                    text("UPDATE sectors SET slug = :slug WHERE id = :id"),
                    {"slug": new_slug, "id": sid}
                )
                print(f"  ✅ '{name}' → slug = '{new_slug}'")
                updated += 1
            elif new_slug:
                print(f"  ✔️  '{name}' já tem slug = '{current_slug}' (ok)")
            else:
                print(f"  ⚠️  '{name}' → slug não mapeado (slug atual: '{current_slug}')")
        
        conn.commit()
        print(f"\n{updated} setor(es) atualizado(s).")

print("\nScript finalizado.")
