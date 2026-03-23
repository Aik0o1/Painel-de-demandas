import asyncio
from core.database import users_collection

async def main():
    users = await users_collection.find({}).to_list(100)
    for u in users:
        print(f"Email: {u.get('email')}, Role: {u.get('role')}, Sector ID: {u.get('sector_id')}")

asyncio.run(main())
