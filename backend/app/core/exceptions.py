"""
Custom exception handlers and domain exceptions for FastAPI application.

Architecture:
- Domain exceptions (ServiceError hierarchy) — raised by service layer, HTTP-agnostic
- Exception handlers — registered on FastAPI app, map domain errors to HTTP responses
"""
import logging
import time
from typing import Any, Dict

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse

from app.core.messages import BACKEND_MESSAGES

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════════════════
# Domain Exceptions — Service layer raises these; API layer catches and maps
# ═══════════════════════════════════════════════════════════════════════════════

class ServiceError(Exception):
    """Base exception for all service-layer errors."""

    def __init__(self, message: str = "An error occurred", code: str = "service_error"):
        self.message = message
        self.code = code
        super().__init__(self.message)


class NotFoundError(ServiceError):
    """Resource not found (maps to 404)."""

    def __init__(self, message: str = "Không tìm thấy tài nguyên", code: str = "not_found"):
        super().__init__(message, code)


class PermissionDeniedError(ServiceError):
    """User lacks permission (maps to 403)."""

    def __init__(self, message: str = "Bạn không có quyền truy cập", code: str = "permission_denied"):
        super().__init__(message, code)


class QuotaExceededError(ServiceError):
    """Quota limit reached (maps to 429)."""

    def __init__(self, message: str = "Đã đạt giới hạn quota", code: str = "quota_exceeded"):
        super().__init__(message, code)


class InvalidInputError(ServiceError):
    """Invalid input data (maps to 400)."""

    def __init__(self, message: str = "Dữ liệu không hợp lệ", code: str = "invalid_input"):
        super().__init__(message, code)


class ConflictError(ServiceError):
    """Resource already exists / conflict (maps to 409)."""

    def __init__(self, message: str = "Xung đột dữ liệu", code: str = "conflict"):
        super().__init__(message, code)


class StorageError(ServiceError):
    """Cloud storage operation failed (maps to 502)."""

    def __init__(self, message: str = "Lỗi lưu trữ đám mây", code: str = "storage_error"):
        super().__init__(message, code)


class SubscriptionExpiredError(ServiceError):
    """User's subscription has expired (maps to 403)."""

    def __init__(self, message: str = None, code: str = "subscription_expired"):
        if message is None:
            message = BACKEND_MESSAGES["errors"]["subscription_expired"]
        super().__init__(message, code)


class LicenseError(ServiceError):
    """License-related errors (maps to 400)."""

    def __init__(self, message: str = "Lỗi license", code: str = "license_error"):
        super().__init__(message, code)


# ═══════════════════════════════════════════════════════════════════════════════
# Domain → HTTP status code mapping
# ═══════════════════════════════════════════════════════════════════════════════

_EXCEPTION_STATUS_MAP: dict[type[ServiceError], int] = {
    NotFoundError: 404,
    PermissionDeniedError: 403,
    QuotaExceededError: 429,
    InvalidInputError: 400,
    ConflictError: 409,
    StorageError: 502,
    SubscriptionExpiredError: 403,
    LicenseError: 400,
}


# ═══════════════════════════════════════════════════════════════════════════════
# FastAPI Exception Handlers
# ═══════════════════════════════════════════════════════════════════════════════

async def service_error_handler(request: Request, exc: ServiceError) -> JSONResponse:
    """Map domain ServiceError to appropriate HTTP response."""
    status_code = _EXCEPTION_STATUS_MAP.get(type(exc), 500)
    return JSONResponse(
        status_code=status_code,
        content={
            "error": exc.code,
            "message": exc.message,
        },
    )


async def rate_limit_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle rate limit exceeded exceptions."""
    if exc.status_code != 429:
        return None
    
    detail = exc.detail
    if isinstance(detail, dict):
        error = detail.get("error", "rate_limit_exceeded")
        message = detail.get("message", BACKEND_MESSAGES["errors"]["rate_limit_exceeded"])
        retry_after = detail.get("retry_after", 60)
    else:
        error = "rate_limit_exceeded"
        message = str(detail) or BACKEND_MESSAGES["errors"]["rate_limit_exceeded"]
        retry_after = 60

    from app.services.rate_limiter import build_rate_limit_headers
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


async def generic_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions with generic message to avoid leaking internals."""
    # Use standard logger, but log full stacktrace
    import logging
    logger = logging.getLogger("app.core.exceptions")
    logger.error(f"Unhandled exception on {request.method} {request.url}: {exc}", exc_info=True)
    
    import traceback
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "message": "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.",
            "detail": traceback.format_exc()
        },
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle HTTP exceptions."""
    detail = exc.detail
    content = {
        "error": f"http_{exc.status_code}",
        "message": detail,
    }
    if isinstance(detail, str):
        content["detail"] = detail
    elif isinstance(detail, dict):
        content["detail"] = detail
    return JSONResponse(
        status_code=exc.status_code,
        content=content,
    )
