"""FastAPI application entry point."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.api.auth import router as auth_router
from app.api.models import router as models_router, router_audio
from app.api.quota import router as quota_router
from app.api.analytics import router as analytics_router
from app.api.tts import router as tts_router
from app.api.normalize import router as normalize_router
from app.api.dictionary import router as dictionary_router
from app.api.language import router as language_router
from app.api.voices import router as voices_router
from app.api.projects import router as projects_router
from app.core.redis import init_redis, close_redis
from app.core.settings import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    await init_redis()
    yield
    # Shutdown
    await close_redis()
    logger.info("Shutting down application")


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
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add exception handlers
from fastapi import HTTPException
from app.core.exceptions import (
    rate_limit_exception_handler,
    generic_exception_handler,
    http_exception_handler,
)

app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(429, rate_limit_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Add logging middleware
from app.middleware.logging import LoggingMiddleware
app.add_middleware(LoggingMiddleware)

# Include routers
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(models_router, prefix=settings.API_V1_PREFIX)
app.include_router(router_audio, prefix=settings.API_V1_PREFIX)
app.include_router(quota_router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics_router, prefix=settings.API_V1_PREFIX)
app.include_router(tts_router, prefix=settings.API_V1_PREFIX)
app.include_router(normalize_router, prefix=settings.API_V1_PREFIX)
app.include_router(dictionary_router, prefix=settings.API_V1_PREFIX)
app.include_router(language_router, prefix=settings.API_V1_PREFIX)
app.include_router(voices_router, prefix=settings.API_V1_PREFIX)
app.include_router(projects_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
    }


@app.get("/health")
def health_check():
    """Health check endpoint with database status."""
    from sqlalchemy import text
    from app.db import engine

    db_status = "disconnected"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        pass

    return {
        "status": "healthy" if db_status == "connected" else "unhealthy",
        "database": db_status,
    }
