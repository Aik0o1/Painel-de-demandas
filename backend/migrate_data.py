import asyncio
import os
import sys
from datetime import datetime
from bson import ObjectId

from core.database import db
from core.database_sql import engine, async_session_maker
from core.models_sql import User, Demand, Ticket, InventoryItem, BudgetCategory, FinanceTransaction
from sqlalchemy import select

def convert_objectids(obj):
    if isinstance(obj, dict):
        return {k: convert_objectids(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_objectids(i) for i in obj]
    elif isinstance(obj, ObjectId):
        return str(obj)
    return obj

async def migrate_data():
    print("Starting data migration from MongoDB to PostgreSQL...")

    async with async_session_maker() as session:
        # Migrate Users
        print("Migrating users...")
        users_cursor = db["users"].find()
        users_count = 0
        async for mongo_user in users_cursor:
            user_id = str(mongo_user.get("_id"))
            existing_user = await session.get(User, user_id)
            if not existing_user:
                new_user = User(
                    id=user_id,
                    name=mongo_user.get("name", ""),
                    email=mongo_user.get("email", ""),
                    image=mongo_user.get("image"),
                    role=mongo_user.get("role", "user"),
                    cpf=mongo_user.get("cpf"),
                    position=mongo_user.get("position"),
                    function=mongo_user.get("function"),
                    protocolNumber=mongo_user.get("protocolNumber"),
                    status=mongo_user.get("status", "PENDING"),
                    permissions=convert_objectids(mongo_user.get("permissions", {})),
                    passwordHash=mongo_user.get("passwordHash", ""),
                    createdAt=mongo_user.get("createdAt", datetime.utcnow()),
                    updatedAt=mongo_user.get("updatedAt", datetime.utcnow())
                )
                session.add(new_user)
                users_count += 1
        await session.commit()
        print(f"Migrated {users_count} users.")

        # Migrate Demands
        print("Migrating demands...")
        demands_cursor = db["demands"].find()
        demands_count = 0
        async for mongo_demand in demands_cursor:
            demand_id = str(mongo_demand.get("_id"))
            existing_demand = await session.get(Demand, demand_id)
            if not existing_demand:
                # Default createdBy id or a fallback
                created_by = str(mongo_demand.get("createdBy", "unknown"))
                if isinstance(mongo_demand.get("createdBy"), ObjectId):
                    created_by = str(mongo_demand.get("createdBy"))
                elif isinstance(mongo_demand.get("createdBy"), dict) and "_id" in mongo_demand.get("createdBy"):
                    created_by = str(mongo_demand.get("createdBy")["_id"])
                elif isinstance(mongo_demand.get("createdBy"), str):
                    created_by = mongo_demand.get("createdBy")

                new_demand = Demand(
                    id=demand_id,
                    title=mongo_demand.get("title", ""),
                    description=mongo_demand.get("description"),
                    priority=mongo_demand.get("priority", "MEDIUM"),
                    status=mongo_demand.get("status", "pending"),
                    assignedTo=str(mongo_demand.get("assignedTo")) if mongo_demand.get("assignedTo") else None,
                    dueDate=mongo_demand.get("dueDate"),
                    createdBy=created_by,
                    completedAt=mongo_demand.get("completedAt"),
                    createdAt=mongo_demand.get("createdAt", datetime.utcnow()),
                    updatedAt=mongo_demand.get("updatedAt", datetime.utcnow())
                )
                session.add(new_demand)
                demands_count += 1
        await session.commit()
        print(f"Migrated {demands_count} demands.")

        # Migrate Tickets
        print("Migrating tickets...")
        tickets_cursor = db["tickets"].find()
        tickets_count = 0
        async for mongo_ticket in tickets_cursor:
            ticket_id = str(mongo_ticket.get("_id"))
            existing_ticket = await session.get(Ticket, ticket_id)
            if not existing_ticket:
                new_ticket = Ticket(
                    id=ticket_id,
                    title=mongo_ticket.get("title", ""),
                    description=mongo_ticket.get("description"),
                    requesterName=mongo_ticket.get("requesterName", "Usuário"),
                    priority=mongo_ticket.get("priority", "MEDIUM"),
                    category=mongo_ticket.get("category", ""),
                    subSector=mongo_ticket.get("subSector", "support"),
                    status=mongo_ticket.get("status", "OPEN"),
                    accumulatedTimeMs=mongo_ticket.get("accumulatedTimeMs", 0),
                    lastStartedAt=mongo_ticket.get("lastStartedAt"),
                    pauseReason=mongo_ticket.get("pauseReason"),
                    resolvedAt=mongo_ticket.get("resolvedAt"),
                    createdAt=mongo_ticket.get("createdAt", datetime.utcnow()),
                    updatedAt=mongo_ticket.get("updatedAt", datetime.utcnow())
                )
                session.add(new_ticket)
                tickets_count += 1
        await session.commit()
        print(f"Migrated {tickets_count} tickets.")

        # Migrate InventoryItems
        print("Migrating inventory items...")
        inventory_cursor = db["inventoryitems"].find()
        inventory_count = 0
        async for mongo_item in inventory_cursor:
            item_id = str(mongo_item.get("_id"))
            existing_item = await session.get(InventoryItem, item_id)
            if not existing_item:
                new_item = InventoryItem(
                    id=item_id,
                    code=mongo_item.get("code", f"UNKNOWN-{item_id}"),
                    name=mongo_item.get("name", ""),
                    category=mongo_item.get("category", ""),
                    location=mongo_item.get("location"),
                    status=mongo_item.get("status", "GOOD"),
                    createdAt=mongo_item.get("created_at", datetime.utcnow()),
                    updatedAt=mongo_item.get("updated_at", datetime.utcnow())
                )
                session.add(new_item)
                inventory_count += 1
        await session.commit()
        print(f"Migrated {inventory_count} inventory items.")

        # Migrate BudgetCategories
        print("Migrating budget categories...")
        categories_cursor = db["budgetcategories"].find()
        categories_count = 0
        async for mongo_cat in categories_cursor:
            cat_id = str(mongo_cat.get("_id"))
            existing_cat = await session.get(BudgetCategory, cat_id)
            if not existing_cat:
                new_cat = BudgetCategory(
                    id=cat_id,
                    name=mongo_cat.get("name", ""),
                    totalAllocated=float(mongo_cat.get("total_allocated", 0.0)),
                    createdAt=mongo_cat.get("createdAt", datetime.utcnow()),
                    updatedAt=mongo_cat.get("updatedAt", datetime.utcnow())
                )
                session.add(new_cat)
                categories_count += 1
        await session.commit()
        print(f"Migrated {categories_count} budget categories.")

        # Migrate FinanceTransactions (formerly Payments)
        print("Migrating finance transactions...")
        payments_cursor = db["payments"].find()
        payments_count = 0
        async for mongo_payment in payments_cursor:
            payment_id = str(mongo_payment.get("_id"))
            existing_tx = await session.get(FinanceTransaction, payment_id)
            if not existing_tx:
                # Need valid category_id
                cat_id = str(mongo_payment.get("category_id"))
                if not await session.get(BudgetCategory, cat_id):
                    print(f"Skipping payment {payment_id} due to invalid category_id {cat_id}")
                    continue

                new_tx = FinanceTransaction(
                    id=payment_id,
                    description=mongo_payment.get("description", ""),
                    amount=float(mongo_payment.get("amount", 0.0)),
                    date=mongo_payment.get("date", datetime.utcnow()),
                    supplier=mongo_payment.get("supplier", ""),
                    status=mongo_payment.get("status", "pending"),
                    attachmentUrl=mongo_payment.get("attachment_url"),
                    categoryId=cat_id,
                    beneficiaries=convert_objectids(mongo_payment.get("beneficiaries", {})),
                    passenger=mongo_payment.get("passenger"),
                    route=mongo_payment.get("route"),
                    createdAt=mongo_payment.get("createdAt", datetime.utcnow()),
                    updatedAt=mongo_payment.get("updatedAt", datetime.utcnow())
                )
                session.add(new_tx)
                payments_count += 1
        await session.commit()
        print(f"Migrated {payments_count} finance transactions.")

    print("Data migration completed successfully!")

if __name__ == "__main__":
    asyncio.run(migrate_data())
