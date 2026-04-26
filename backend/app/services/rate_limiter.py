"""Rate limiting service using Redis."""
import logging
import time
from typing import Optional, Tuple

from fastapi import Depends, HTTPException, Request, Response
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.responses import JSONResponse

from app.api.auth import get_current_user
from app.core.redis import get_redis, is_redis_available
from app.models.user import User

logger = logging.getLogger(__name__)


TIER_LIMITS = {
    "free": {"requests": 100, "window": 3600},
    "basic": {"requests": 1000, "window": 3600},
    "pro": {"requests": 10000, "window": 3600},
    "enterprise": {"requests": 100000, "window": 3600},
}

PUBLIC_RATE_LIMIT = "10/minute"


def get_user_identifier(request: Request) -> str:
    """Get rate limit identifier: API Key > User ID > IP."""
    api_key = request.headers.get("X-API-Key")
    if api_key:
        return f"api_key:{api_key}"
    
    user = getattr(request.state, "user", None)
    if user and hasattr(user, "id"):
        return f"user:{user.id}"
    
    client_ip = request.client.host if request.client else "unknown"
    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        client_ip = x_forwarded_for.split(",")[0].strip()
    
    cf_connecting_ip = request.headers.get("CF-Connecting-IP")
    if cf_connecting_ip:
        client_ip = cf_connecting_ip
    
    return f"ip:{client_ip}"


def get_tier_limit(tier: str) -> Tuple[int, int]:
    """Get request limit and window for a tier."""
    tier_config = TIER_LIMITS.get(tier, TIER_LIMITS["free"])
    return tier_config["requests"], tier_config["window"]


async def check_rate_limit(
    identifier: str, 
    limit: int = 100, 
    window: int = 3600
) -> Tuple[int, int, int, bool]:
    """
    Check and update rate limit using sliding window algorithm.
    
    Returns: (limit, remaining, reset_timestamp, is_limited)
    """
    redis_client = get_redis()
    
    if not redis_client:
        return limit, limit, int(time.time()) + window, False
    
    try:
        key = f"rate_limit:{identifier}"
        current_time = int(time.time())
        window_start = current_time - window
        
        pipe = redis_client.pipeline()
        pipe.zremrangebyscore(key, 0, window_start)
        pipe.zcard(key)
        pipe.zadd(key, {str(current_time): current_time})
        pipe.expire(key, window)
        results = await pipe.execute()
        
        request_count = results[1]
        remaining = max(0, limit - request_count)
        reset_timestamp = current_time + window
        is_limited = request_count >= limit
        
        if is_limited:
            logger.warning(f"Rate limit exceeded for {identifier}")
        
        return limit, remaining, reset_timestamp, is_limited
        
    except Exception as e:
        logger.error(f"Rate limit check failed: {e}")
        return limit, limit, int(time.time()) + window, False


async def rate_limit_dependency(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
) -> None:
    """
    FastAPI dependency for rate limiting.
    
    Usage:
        @app.get("/api/protected")
        async def protected_endpoint(request: Request, rate_limit: dict = Depends(rate_limit_dependency)):
            return {"data": "ok"}
    """
    if current_user and not getattr(request.state, "user", None):
        request.state.user = current_user

    identifier = get_user_identifier(request)

    user_tier = getattr(current_user, "subscription_tier", "free") or "free"
    
    limit, window = get_tier_limit(user_tier)
    limit_val, remaining, reset_ts, is_limited = await check_rate_limit(identifier, limit, window)
    headers = build_rate_limit_headers(limit_val, remaining, reset_ts)
    
    if is_limited:
        retry_after = reset_ts - int(time.time())
        raise HTTPException(
            status_code=429,
            detail={
                "error": "rate_limit_exceeded",
                "message": f"API rate limit exceeded. Please try again in {retry_after} seconds.",
                "retry_after": retry_after,
            },
            headers={**headers, "X-RateLimit-Remaining": "0", "Retry-After": str(retry_after)},
        )
    
    response.headers.update(headers)


def build_rate_limit_headers(limit: int, remaining: int, reset_ts: int) -> dict:
    """Build rate limit response headers."""
    return {
        "X-RateLimit-Limit": str(limit),
        "X-RateLimit-Remaining": str(remaining),
        "X-RateLimit-Reset": str(reset_ts),
    }
