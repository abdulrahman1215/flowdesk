# app/core/database.py
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings


# The engine is the connection pool — one per app lifetime
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,   # logs SQL queries in development
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