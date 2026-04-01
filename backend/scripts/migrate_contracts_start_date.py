import asyncio
import os
from sqlalchemy import text
from core.database_sql import engine
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()

async def add_start_date_column():
    async with engine.begin() as conn:
        print("Checking if startDate column exists in contracts table...")
        # Check if column exists (PostgreSQL syntax)
        result = await conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='contracts' AND column_name='startDate';
        """))
        
        if not result.scalar():
            print("Adding startDate column to contracts table...")
            await conn.execute(text('ALTER TABLE contracts ADD COLUMN "startDate" TIMESTAMP WITHOUT TIME ZONE;'))
            print("Column added successfully.")
        else:
            print("Column already exists.")

if __name__ == "__main__":
    asyncio.run(add_start_date_column())
