"""
fix_sector_slugs.py
Popula a coluna 'slug' da tabela sectors no banco de produção.
Execute: python fix_sector_slugs.py
"""
import os
from sqlalchemy import create_engine, text

db_url = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5433/demand_navigator"
).replace("+asyncpg", "")  # usa driver síncrono para este script

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

with engine.connect() as conn:
    result = conn.execute(text("SELECT id, name, slug FROM sectors"))
    sectors = result.fetchall()

    if not sectors:
        print("⚠️  Nenhum setor encontrado na tabela 'sectors'.")
    else:
        print(f"Setores encontrados: {len(sectors)}")
        for row in sectors:
            sid, name, current_slug = row
            new_slug = SLUG_MAP.get(name)
            if new_slug and current_slug != new_slug:
                conn.execute(
                    text("UPDATE sectors SET slug = :slug WHERE id = :id"),
                    {"slug": new_slug, "id": sid}
                )
                print(f"  ✅ '{name}' → slug = '{new_slug}'")
            elif new_slug:
                print(f"  ✔️  '{name}' já tem slug = '{current_slug}' (ok)")
            else:
                print(f"  ⚠️  '{name}' → slug não mapeado (slug atual: '{current_slug}')")

    conn.commit()

print("\nScript finalizado.")
