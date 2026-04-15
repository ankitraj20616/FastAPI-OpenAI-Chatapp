from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017"
    db_name: str = "chatapp"

    # JWT
    secret_key: str = "change-this-in-production-please"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # CORS
    frontend_url: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
