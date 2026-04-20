# Plan: F1.6 - Rate Limiting với Redis

## Technology Stack
- **Library**: `slowapi` (FastAPI rate limiter - compatible với Redis)
- **Storage**: Redis (sliding window algorithm)
- **Config**: `.env` file

---

## Implementation Steps

### Step 1: Cấu hình Redis Connection
```python
# backend/app/core/redis.py
import redis.asyncio as redis
from app.core.settings import get_settings

settings = get_settings()

redis_client: redis.Redis = None

async def init_redis():
    global redis_client
    redis_client = redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        password=settings.REDIS_PASSWORD,
        decode_responses=True
    )

async def close_redis():
    if redis_client:
        await redis_client.close()
```

### Step 2: Tạo Rate Limiter Service  
```python
# backend/app/services/rate_limiter.py
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, HTTPException
from functools import asynccontextmanager
import time

limiter = Limiter(key_func=get_remote_address)

async def get_user_identifier(request: Request) -> str:
    """Get identifier: API Key > User ID > IP"""
    api_key = request.headers.get("X-API-Key")
    if api_key:
        return f"api_key:{api_key}"
    
    user = getattr(request.state, "user", None)
    if user:
        return f"user:{user.id}"
    
    return get_remote_address(request)

def rate_limit_response(limit: int, remaining: int, reset: int):
    """Build rate limit headers"""
    return {
        "X-RateLimit-Limit": str(limit),
        "X-RateLimit-Remaining": str(remaining),
        "X-RateLimit-Reset": str(reset),
        "Retry-After": str(reset - int(time.time()))
    }
```

### Step 3: Tích hợp vào FastAPI App
```python
# backend/app/main.py
from app.core.redis import init_redis, close_redis
from app.services.rate_limiter import limiter

@app.on_event("startup")
async def startup():
    await init_redis()

@app.on_event("shutdown") 
async def shutdown():
    await close_redis()

# Public endpoints (IP-based)
@app.get("/api/public")
@limiter.limit("10/minute")
async def public_endpoint(request: Request):
    return {"status": "ok"}

# Protected endpoints (User-tier based)
@app.get("/api/generate")
@limiter.limit("50/minute")  # Default for authenticated
async def generate(request: Request):
    return {"status": "ok"}
```

### Step 4: Tier-based Limits
```python
# backend/app/services/rate_limiter.py
TIER_LIMITS = {
    "free": {"requests": 100, "窗口": 3600},      # 100 req/hour
    "basic": {"requests": 1000, "窗口": 3600},    # 1000 req/hour  
    "pro": {"requests": 10000, "窗口": 3600},    # 10000 req/hour
    "enterprise": {"requests": 100000, "窗口": 3600} # Unlimited
}

def get_tier_limit(tier: str) -> tuple:
    limit = TIER_LIMITS.get(tier, TIER_LIMITS["free"])
    return f"{limit['requests']}/{limit['window']}seconds"
```

### Step 5: Custom Exception Handler
```python
# backend/app/core/exceptions.py
from slowapi.errors import RateLimitExceeded as SlowApiRateLimit
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(SlowApiRateLimit)
async def rate_limit_handler(request: Request, exc: SlowApiRateLimit):
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "message": f"API rate limit exceeded. Please try again in {exc.detail} seconds.",
            "retry_after": int(exc.detail)
        },
        headers={
            "Retry-After": exc.detail,
            "X-RateLimit-Limit": "100",
            "X-RateLimit-Remaining": "0"
        }
    )
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `app/core/redis.py` | Create | Redis connection pool |
| `app/services/rate_limiter.py` | Create | Rate limiter service |
| `app/core/exceptions.py` | Create | Custom exception handlers |
| `app/main.py` | Modify | Add startup/shutdown, limiter |
| `.env` | Modify | Add REDIS_* vars |
| `requirements.txt` | Modify | Add slowapi, redis |

---

## Acceptance Checkpoints

- [ ] Redis connects on startup, closes on shutdown
- [ ] Public endpoints limited by IP (10/min)
- [ ] Protected endpoints limited by User Tier
- [ ] 429 response includes headers
- [ ] Fallback when Redis unavailable

---

## Follow-ups
- Add Redis health check endpoint
- Add per-endpoint custom limits
- Add dashboard showing user's usage