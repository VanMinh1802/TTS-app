"""Request logging middleware."""
import time
import logging
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.uow import UnitOfWork
from app.db import get_db
from app.services.analytics_service import AnalyticsService, normalize_request_metadata

logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware to log all API requests."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not request.url.path.startswith("/api"):
            return await call_next(request)

        start_time = time.time()

        request_metadata = normalize_request_metadata(request)
        response = await call_next(request)

        latency_ms = int((time.time() - start_time) * 1000)

        db_gen = get_db()
        db = None
        try:
            db = next(db_gen)
            uow = UnitOfWork(db)
            service = AnalyticsService(uow)
            service.log_request(
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                latency_ms=latency_ms,
                user_id=request_metadata["user_id"],
                ip_address=request_metadata["ip_address"],
                user_agent=request_metadata["user_agent"],
            )
        except Exception as e:
            logger.warning(f"Failed to log request: {e}")
        finally:
            try:
                if db is not None:
                    db.close()
            finally:
                db_gen.close()
        
        return response
