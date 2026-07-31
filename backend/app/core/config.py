# app/core/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List


def normalize_database_url(value: str) -> str:
    """Return an async SQLAlchemy Postgres URL for the FastAPI app."""
    value = value.strip()

    postgres_prefixes = (
        "postgres://",
        "postgresql://",
        "postgresql+psycopg2://",
    )

    if value.startswith("postgresql+asyncpg://"):
        return value

    for prefix in postgres_prefixes:
        if value.startswith(prefix):
            return value.replace(prefix, "postgresql+asyncpg://", 1)

    return value


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    # App
    APP_NAME: str = "FlowDesk"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Demo seed data
    SEED_DEMO_USERS: bool = False
    DEMO_PASSWORD: str = "DemoPass123!"
    DEMO_WORKSPACE_NAME: str = "FlowDesk Demo Workspace"
    DEMO_WORKSPACE_SLUG: str = "flowdesk-demo-workspace"

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def use_async_database_driver(cls, value: str) -> str:
        return normalize_database_url(str(value))


# Single instance used everywhere — import this, not Settings()
settings = Settings()
