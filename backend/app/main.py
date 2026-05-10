"""Điểm khởi động ứng dụng FastAPI."""

import sys
print("[STARTUP] main.py loaded", file=sys.stderr, flush=True)

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.models import router as models_router, router_audio
from app.api.quota import router as quota_router
from app.api.analytics import router as analytics_router
from app.api.tts import router as tts_router
from app.api.normalize import router as normalize_router
from app.api.dictionary import router as dictionary_router
from app.api.language import router as language_router
from app.api.voices import router as voices_router
from app.api.auth import router as auth_router
from app.api.license import router as license_router
from app.api.library import router as library_router
from app.core.redis import init_redis, close_redis
from app.db import init_db
from app.core.settings import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Xử lý vòng đời ứng dụng."""
    print("[LIFESPAN] Starting...", file=sys.stderr, flush=True)
    try:
        print("[LIFESPAN] Calling init_db()...", file=sys.stderr, flush=True)
        init_db()
        print("[LIFESPAN] DB initialized OK", file=sys.stderr, flush=True)
    except Exception as e:
        print(f"[LIFESPAN] DB init FAILED: {e}", file=sys.stderr, flush=True)
        import traceback
        traceback.print_exc(file=sys.stderr)
        raise
    try:
        print("[LIFESPAN] Calling init_redis()...", file=sys.stderr, flush=True)
        await init_redis()
        print("[LIFESPAN] Redis initialized OK", file=sys.stderr, flush=True)
    except Exception as e:
        print(f"[LIFESPAN] Redis init FAILED: {e}", file=sys.stderr, flush=True)
    yield
    await close_redis()
    print("[LIFESPAN] Shutdown complete", file=sys.stderr, flush=True)


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# Add exception handlers
from fastapi import HTTPException
from app.core.exceptions import (
    rate_limit_exception_handler,
    generic_exception_handler,
    http_exception_handler,
    ServiceError,
    service_error_handler,
)

app.add_exception_handler(ServiceError, service_error_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(429, rate_limit_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Add logging middleware
from app.middleware.logging import LoggingMiddleware
app.add_middleware(LoggingMiddleware)

# Add CSRF protection middleware for mutating requests
from app.middleware.csrf import CSRFMiddleware
app.add_middleware(CSRFMiddleware)

# Add GZip compression middleware
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add CORS middleware — must be added LAST so it wraps everything
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-API-Key", "X-CSRF-Token"],
)

# Include routers
app.include_router(models_router, prefix=settings.API_V1_PREFIX)
app.include_router(router_audio, prefix=settings.API_V1_PREFIX)
app.include_router(quota_router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics_router, prefix=settings.API_V1_PREFIX)
app.include_router(tts_router, prefix=settings.API_V1_PREFIX)
app.include_router(normalize_router, prefix=settings.API_V1_PREFIX)
app.include_router(dictionary_router, prefix=settings.API_V1_PREFIX)
app.include_router(language_router, prefix=settings.API_V1_PREFIX)
app.include_router(voices_router, prefix=settings.API_V1_PREFIX)
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(library_router, prefix=settings.API_V1_PREFIX)
app.include_router(license_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint with database status."""
    from app.db import engine

    db_status = "disconnected"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        logger.warning(f"Health check DB ping failed: {e}")

    return {
        "status": "healthy" if db_status == "connected" else "unhealthy",
        "database": db_status,
    }

