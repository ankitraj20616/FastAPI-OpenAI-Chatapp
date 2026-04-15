from motor.motor_asyncio import AsyncIOMotorClient
from app.config import get_settings

settings = get_settings()

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.db_name]
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    await db.conversations.create_index("user_id")
    await db.conversations.create_index("updated_at")
    await db.messages.create_index("conversation_id")
    await db.messages.create_index("created_at")
    print(f"Connected to MongoDB: {settings.db_name}")


async def close_db():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")


def get_db():
    return db
