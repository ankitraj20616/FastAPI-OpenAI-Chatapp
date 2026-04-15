from typing import AsyncGenerator, List
from openai import AsyncOpenAI
from app.config import get_settings

settings = get_settings()
_client: AsyncOpenAI = None


def get_openai_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.openai_api_key)
    return _client


async def stream_chat_response(
    messages: List[dict],
) -> AsyncGenerator[str, None]:
    """
    Stream tokens from OpenAI. messages format:
    [{"role": "user"|"assistant"|"system", "content": "..."}]
    """
    client = get_openai_client()
    system_message = {
        "role": "system",
        "content": (
            "You are a helpful, knowledgeable, and friendly AI assistant. "
            "Provide clear, accurate, and thoughtful responses. "
            "Format your responses using markdown when appropriate."
        ),
    }

    stream = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[system_message] + messages,
        stream=True,
        temperature=0.7,
        max_tokens=2048,
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            yield delta.content
