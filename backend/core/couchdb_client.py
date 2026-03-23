import os
import couchdb
from urllib.parse import quote
from dotenv import load_dotenv

load_dotenv()

# Database connection setup
password = os.getenv("COUCHDB_SENHA")
ip = os.getenv("COUCHDB_IP")

if not password or not ip:
    raise ValueError("COUCHDB_SENHA e COUCHDB_IP devem estar definidos no .env")

encoded_password = quote(password)
couch = couchdb.Server(f'http://admin:{encoded_password}@{ip}')

# Database: painel_de_demandas_dados_registro
DB_NAME = "painel_de_demandas_dados_registro"

def get_registro_db():
    """Retorna a instância do banco painel_de_demandas_dados_registro."""
    if DB_NAME not in couch:
        raise RuntimeError(f"Banco de dados '{DB_NAME}' não encontrado no servidor CouchDB.")
    return couch[DB_NAME]
