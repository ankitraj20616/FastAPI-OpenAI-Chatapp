from fastapi import APIRouter, HTTPException, Depends, status
from datetime import datetime, timezone
from typing import List
from bson import ObjectId
from app.database import get_db
from app.models.conversation import (
    ConversationCreate,
    ConversationUpdate,
    ConversationResponse,
    ConversationWithMessages,
    MessageResponse,
)
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/conversations", tags=["Conversations"])


def fmt_conv(doc: dict, message_count: int = 0) -> ConversationResponse:
    return ConversationResponse(
        id=str(doc["_id"]),
        user_id=str(doc["user_id"]),
        title=doc["title"],
        created_at=doc["created_at"],
        updated_at=doc["updated_at"],
        message_count=message_count,
    )


def fmt_msg(doc: dict) -> MessageResponse:
    return MessageResponse(
        id=str(doc["_id"]),
        conversation_id=str(doc["conversation_id"]),
        role=doc["role"],
        content=doc["content"],
        created_at=doc["created_at"],
    )


@router.get("", response_model=List[ConversationResponse])
async def list_conversations(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user["_id"]
    convs = await db.conversations.find(
        {"user_id": user_id}
    ).sort("updated_at", -1).to_list(100)

    result = []
    for conv in convs:
        count = await db.messages.count_documents(
            {"conversation_id": conv["_id"]}
        )
        result.append(fmt_conv(conv, count))
    return result


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    payload: ConversationCreate,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    now = datetime.now(timezone.utc)
    doc = {
        "user_id": current_user["_id"],
        "title": payload.title or "New Conversation",
        "created_at": now,
        "updated_at": now,
    }
    result = await db.conversations.insert_one(doc)
    doc["_id"] = result.inserted_id
    return fmt_conv(doc, 0)


@router.get("/{conv_id}", response_model=ConversationWithMessages)
async def get_conversation(
    conv_id: str,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    try:
        oid = ObjectId(conv_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid conversation ID")

    conv = await db.conversations.find_one(
        {"_id": oid, "user_id": current_user["_id"]}
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = await db.messages.find(
        {"conversation_id": oid}
    ).sort("created_at", 1).to_list(1000)

    return ConversationWithMessages(
        id=str(conv["_id"]),
        user_id=str(conv["user_id"]),
        title=conv["title"],
        created_at=conv["created_at"],
        updated_at=conv["updated_at"],
        messages=[fmt_msg(m) for m in messages],
    )


@router.patch("/{conv_id}", response_model=ConversationResponse)
async def rename_conversation(
    conv_id: str,
    payload: ConversationUpdate,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    try:
        oid = ObjectId(conv_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid conversation ID")

    result = await db.conversations.find_one_and_update(
        {"_id": oid, "user_id": current_user["_id"]},
        {"$set": {"title": payload.title, "updated_at": datetime.now(timezone.utc)}},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Conversation not found")

    count = await db.messages.count_documents({"conversation_id": oid})
    return fmt_conv(result, count)


@router.delete("/{conv_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conv_id: str,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    try:
        oid = ObjectId(conv_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid conversation ID")

    result = await db.conversations.delete_one(
        {"_id": oid, "user_id": current_user["_id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Cascade delete messages
    await db.messages.delete_many({"conversation_id": oid})
