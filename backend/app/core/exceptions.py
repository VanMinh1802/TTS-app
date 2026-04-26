"""Custom exception handlers for FastAPI application."""
import logging
import time
from typing import Any, Dict

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse

from app.services.rate_limiter import build_rate_limit_headers

logger = logging.getLogger(__name__)


async def rate_limit_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle rate limit exceeded exceptions."""
    if exc.status_code != 429:
        return None
    
    detail = exc.detail
    if isinstance(detail, dict):
        error = detail.get("error", "rate_limit_exceeded")
        message = detail.get("message", "Too many requests")
        retry_after = detail.get("retry_after", 60)
    else:
        error = "rate_limit_exceeded"
        message = str(detail)
        retry_after = 60

    headers = exc.headers or build_rate_limit_headers(100, 0, int(retry_after) + int(time.time()))
    headers = {
        **headers,
        "Retry-After": str(retry_after),
    }
    
    return JSONResponse(
        status_code=429,
        content={
            "error": error,
            "message": message,
            "retry_after": retry_after,
        },
        headers=headers,
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unhandled exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "message": "An unexpected error occurred. Please try again later.",
        },
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": f"http_{exc.status_code}",
            "message": exc.detail,
        },
    )
