from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import connect_db, close_db
from app.routes import auth, conversations, chat
from app.config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="ChatApp API",
    description="Production-grade ChatGPT-like API with FastAPI, MongoDB, and OpenAI",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(conversations.router)
app.include_router(chat.router)


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "message": "ChatApp API is running 🚀"}


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}
