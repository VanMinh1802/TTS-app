"""Redis connection pool management."""
import logging
from typing import Optional

import redis as redis_sync
import redis.asyncio as redis_async
from redis import Redis as RedisSync
from redis.asyncio import Redis as RedisAsync

from app.core.settings import settings

logger = logging.getLogger(__name__)

redis_client: Optional[RedisAsync] = None
redis_sync_client: Optional[RedisSync] = None


async def init_redis() -> Optional[RedisAsync]:
    """Initialize Redis connection pool."""
    global redis_client
    global redis_sync_client

    try:
        redis_client = redis_async.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
            db=settings.REDIS_DB,
            ssl=settings.REDIS_SSL,
            decode_responses=True,
            socket_connect_timeout=settings.REDIS_CONNECT_TIMEOUT,
            socket_timeout=settings.REDIS_SOCKET_TIMEOUT,
            max_connections=settings.REDIS_MAX_CONNECTIONS,
            retry_on_timeout=settings.REDIS_RETRY_ON_TIMEOUT,
            health_check_interval=settings.REDIS_HEALTH_CHECK_INTERVAL,
        )

        redis_sync_client = redis_sync.Redis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
            db=settings.REDIS_DB,
            ssl=settings.REDIS_SSL,
            decode_responses=True,
            socket_connect_timeout=settings.REDIS_CONNECT_TIMEOUT,
            socket_timeout=settings.REDIS_SOCKET_TIMEOUT,
            max_connections=settings.REDIS_MAX_CONNECTIONS,
            retry_on_timeout=settings.REDIS_RETRY_ON_TIMEOUT,
            health_check_interval=settings.REDIS_HEALTH_CHECK_INTERVAL,
        )

        await redis_client.ping()
        redis_sync_client.ping()
        logger.info(f"Redis connected: {settings.REDIS_HOST}:{settings.REDIS_PORT}")
        return redis_client
    except Exception as e:
        redis_client = None
        redis_sync_client = None
        logger.warning(f"Redis connection failed: {e}. Rate limiting will be bypassed.")
        return None


async def close_redis() -> None:
    """Close Redis connection pool."""
    global redis_client
    global redis_sync_client

    if redis_client:
        await redis_client.close()
        redis_client = None

    if redis_sync_client:
        redis_sync_client.close()
        redis_sync_client = None

    if redis_client or redis_sync_client:
        logger.info("Redis connection closed")


def get_redis() -> Optional[RedisAsync]:
    """Get Redis client instance."""
    return redis_client
