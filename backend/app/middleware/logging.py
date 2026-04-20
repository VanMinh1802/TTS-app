"""Request logging middleware."""
import time
import logging
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.db import get_db
from app.services.analytics_service import AnalyticsService

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all API requests."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not request.url.path.startswith("/api"):
            return await call_next(request)

        start_time = time.time()
        
        user_id = None
        if hasattr(request.state, "user") and request.state.user:
            user_id = getattr(request.state.user, "id", None)
        
        client_ip = request.client.host if request.client else None
        x_forwarded_for = request.headers.get("X-Forwarded-For")
        if x_forwarded_for:
            client_ip = x_forwarded_for.split(",")[0].strip()
        
        response = await call_next(request)
        
        latency_ms = int((time.time() - start_time) * 1000)
        
        try:
            db = next(get_db())
            service = AnalyticsService(db)
            service.log_request(
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                latency_ms=latency_ms,
                user_id=user_id,
                ip_address=client_ip,
                user_agent=request.headers.get("User-Agent"),
            )
        except Exception as e:
            logger.warning(f"Failed to log request: {e}")
        
        return response