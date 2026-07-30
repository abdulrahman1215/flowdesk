from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.engine import make_url
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings
from typing import Optional
import socket


# The engine is the connection pool — one per app lifetime
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,   # logs SQL queries in development
    pool_pre_ping=True,    # verifies pooled connections before reusing them
    pool_size=10,           # max 10 persistent connections
    max_overflow=20,        # 20 extra connections allowed under load
)

# Session factory — creates DB sessions on demand
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # objects stay usable after commit
)


# All your ORM models will inherit from this
class Base(DeclarativeBase):
    pass


def _database_host() -> str:
    try:
        return make_url(settings.DATABASE_URL).host or "unknown"
    except Exception:
        return "unknown"


def _caused_by_dns_error(exc: BaseException) -> bool:
    current: Optional[BaseException] = exc

    while current is not None:
        if isinstance(current, socket.gaierror):
            return True
        current = current.__cause__ or current.__context__

    return False


async def init_database() -> None:
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except (socket.gaierror, OperationalError) as exc:
        if not _caused_by_dns_error(exc):
            raise

        host = _database_host()
        raise RuntimeError(
            "Database host could not be resolved. "
            f"DATABASE_URL currently points to host '{host}'. "
            "Use a reachable Postgres connection string. If this is running "
            "on Render, do not use the Docker Compose host 'postgres'; use "
            "your Render Postgres Internal Database URL and the "
            "'postgresql+asyncpg://' scheme."
        ) from exc


# FastAPI dependency — inject a DB session into any route
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
