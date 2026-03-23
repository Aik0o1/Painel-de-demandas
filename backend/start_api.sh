#!/bin/bash
cd "$(dirname "$0")"

echo "Instalando virtualenv se necessário..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

echo "Ativando ambiente virtual..."
source venv/bin/activate

echo "Instalando dependências..."
pip install -r requirements.txt

echo "Iniciando a API FastAPI na porta 8000..."
uvicorn main:app --reload --host 0.0.0.0 --port 8000
