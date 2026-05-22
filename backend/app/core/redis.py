# app/core/redis.py
import redis.asyncio as aioredis
from app.core.config import settings

# Single shared connection pool for the whole app
_redis_pool: aioredis.Redis | None = None


async def get_redis() -> aioredis.Redis:
    """Returns the shared Redis connection pool."""
    global _redis_pool
    if _redis_pool is None:
        _redis_pool = aioredis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,   # always return str, not bytes
            max_connections=20,
        )
    return _redis_pool


async def close_redis() -> None:
    global _redis_pool
    if _redis_pool:
        await _redis_pool.aclose()
        _redis_pool = None


def workspace_channel(workspace_id: str) -> str:
    """Redis Pub/Sub channel name for a workspace."""
    return f"ws:workspace:{workspace_id}"