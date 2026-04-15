import json
import asyncio
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
from bson import ObjectId
from app.database import get_db
from app.models.conversation import MessageCreate
from app.services.openai_service import stream_chat_response
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/stream/{conv_id}")
async def chat_stream(
    conv_id: str,
    payload: MessageCreate,
    current_user: dict = Depends(get_current_user),
):
    db = get_db()
    try:
        conv_oid = ObjectId(conv_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid conversation ID")

    # Verify conversation belongs to user
    conv = await db.conversations.find_one(
        {"_id": conv_oid, "user_id": current_user["_id"]}
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Save user message
    user_msg_doc = {
        "conversation_id": conv_oid,
        "role": "user",
        "content": payload.content,
        "created_at": datetime.now(timezone.utc),
    }
    await db.messages.insert_one(user_msg_doc)

    # Build conversation history for OpenAI
    history = await db.messages.find(
        {"conversation_id": conv_oid}
    ).sort("created_at", 1).to_list(100)

    openai_messages = [
        {"role": msg["role"], "content": msg["content"]} for msg in history
    ]

    # Auto-generate title from first user message
    is_first_message = len(history) == 1
    if is_first_message:
        title = payload.content[:60] + ("..." if len(payload.content) > 60 else "")
        await db.conversations.update_one(
            {"_id": conv_oid},
            {"$set": {"title": title, "updated_at": datetime.now(timezone.utc)}},
        )
    else:
        await db.conversations.update_one(
            {"_id": conv_oid},
            {"$set": {"updated_at": datetime.now(timezone.utc)}},
        )

    # Stream response
    async def event_stream():
        full_content = []
        try:
            async for token in stream_chat_response(openai_messages):
                full_content.append(token)
                data = json.dumps({"token": token, "done": False})
                yield f"data: {data}\n\n"

            # Save assistant message
            assistant_content = "".join(full_content)
            await db.messages.insert_one(
                {
                    "conversation_id": conv_oid,
                    "role": "assistant",
                    "content": assistant_content,
                    "created_at": datetime.now(timezone.utc),
                }
            )

            # Signal stream end with conversation title
            updated_conv = await db.conversations.find_one({"_id": conv_oid})
            done_data = json.dumps(
                {
                    "done": True,
                    "conversation_title": updated_conv["title"] if updated_conv else conv["title"],
                }
            )
            yield f"data: {done_data}\n\n"

        except Exception as e:
            error_data = json.dumps({"error": str(e), "done": True})
            yield f"data: {error_data}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        },
    )
