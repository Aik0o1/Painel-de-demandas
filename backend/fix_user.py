import asyncio
from core.database import users_collection

async def main():
    res = await users_collection.update_one(
        {"email": "userfinanceiro@jucepi.com"},
        {"$set": {"sector_id": "financeira"}}
    )
    print("Modified count:", res.modified_count)

asyncio.run(main())
