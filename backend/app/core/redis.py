"""Redis connection pool management."""
import logging
from typing import Optional

import redis.asyncio as redis
from redis.asyncio import Redis

from app.core.settings import settings

logger = logging.getLogger(__name__)

redis_client: Optional[Redis] = None


async def init_redis() -> Redis:
    """Initialize Redis connection pool."""
    global redis_client
    
    try:
        redis_client = redis.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
            db=settings.REDIS_DB,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5,
        )
        await redis_client.ping()
        logger.info(f"Redis connected: {settings.REDIS_HOST}:{settings.REDIS_PORT}")
        return redis_client
    except Exception as e:
        logger.warning(f"Redis connection failed: {e}. Rate limiting will be bypassed.")
        return None


async def close_redis() -> None:
    """Close Redis connection pool."""
    global redis_client
    
    if redis_client:
        await redis_client.close()
        redis_client = None
        logger.info("Redis connection closed")


def get_redis() -> Optional[Redis]:
    """Get Redis client instance."""
    return redis_client


async def is_redis_available() -> bool:
    """Check if Redis is available."""
    try:
        if redis_client:
            await redis_client.ping()
            return True
    except Exception:
        pass
    return False
