"""Token blacklist using Redis for logout and refresh rotation."""
from app.core.redis import redis_sync_client, redis_client


def blacklist_access_token(jti: str, ttl: int = 3600) -> None:
    """Blacklist an access token by JWT ID. TTL defaults to 60 min."""
    if redis_sync_client:
        redis_sync_client.setex(f"token_bl:{jti}", ttl, "1")


def blacklist_refresh_token(jti: str, ttl: int = 604800) -> None:
    """Blacklist a refresh token by JWT ID. TTL defaults to 7 days."""
    if redis_sync_client:
        redis_sync_client.setex(f"refresh_bl:{jti}", ttl, "1")


def is_token_blacklisted(jti: str) -> bool:
    """Check if an access token's JTI is blacklisted."""
    if not redis_sync_client:
        return False
    return redis_sync_client.exists(f"token_bl:{jti}") == 1


def is_refresh_blacklisted(jti: str) -> bool:
    """Check if a refresh token's JTI is blacklisted."""
    if not redis_sync_client:
        return False
    return redis_sync_client.exists(f"refresh_bl:{jti}") == 1
