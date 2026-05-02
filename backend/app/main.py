"""Điểm khởi động ứng dụng FastAPI."""

import asyncio
import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import text

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware


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

# Temporarily comment out admin metrics until models are fixed
# from app.api.admin.metrics import router as admin_metrics_router
from app.core.metrics import metrics_response
from app.core.dependencies import get_admin_user
from app.core.redis import init_redis, close_redis, is_redis_available
from app.core.settings import settings
from app.db import SessionLocal, engine
from app.services.cleanup_task import cleanup_expired_audio_records

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Xử lý vòng đời ứng dụng."""
    # Khởi động
    logger.info(f"Đang khởi động {settings.APP_NAME} v{settings.APP_VERSION}")
    await init_redis()
    
    # Khởi động cronjob
    async def run_cleanup():
        """Run cleanup in thread pool to avoid blocking event loop."""
        def _sync_cleanup():
            db = SessionLocal()
            try:
                cleanup_expired_audio_records(db)
            finally:
                db.close()
        await asyncio.to_thread(_sync_cleanup)
            
    scheduler = AsyncIOScheduler()
    # Chạy mỗi ngày lúc nửa đêm
    scheduler.add_job(run_cleanup, 'cron', hour=0, minute=0)
    scheduler.start()
    
    yield
    # Tắt ứng dụng
    scheduler.shutdown()
    await close_redis()
    logger.info("Đang tắt ứng dụng")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Api-Key", "X-Requested-With"],
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
from app.middleware.csrf import CsrfMiddleware

app.add_middleware(LoggingMiddleware)

# Add CSRF middleware
app.add_middleware(CsrfMiddleware)

# Add rate limit middleware
from app.middleware.rate_limit import RateLimitMiddleware

app.add_middleware(RateLimitMiddleware)

# Add GZip compression middleware
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)

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
# app.include_router(admin_metrics_router, prefix=settings.API_V1_PREFIX)


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
    """Health check endpoint with database and Redis status."""
    db_status = "disconnected"
    redis_status = "disconnected"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        pass

    try:
        redis_status = "connected" if await is_redis_available() else "disconnected"
    except Exception:
        pass

    overall_healthy = db_status == "connected" and redis_status == "connected"

    return {
        "status": "healthy" if overall_healthy else "unhealthy",
        "database": db_status,
        "redis": redis_status,
    }


@app.get("/metrics", dependencies=[Depends(get_admin_user)])
def prometheus_metrics():
    """Prometheus metrics endpoint (admin only)"""
    return metrics_response()
