import asyncio
import os
import sys
from dotenv import load_dotenv
from sqlalchemy import text

load_dotenv()
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from core.database_sql import engine

async def check_tables():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
        tables = result.scalars().all()
        print(f"Tables in DB: {tables}")
        
        if 'demands' in tables:
            columns = await conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'demands'"))
            print("Columns in 'demands' table:")
            for col in columns:
                print(f" - {col}")
        else:
            print("Table 'demands' NOT FOUND!")

if __name__ == "__main__":
    asyncio.run(check_tables())
