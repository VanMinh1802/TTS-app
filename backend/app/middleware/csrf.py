"""CSRF enforcement middleware for mutating HTTP methods."""
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, Response
from app.core.csrf import validate_csrf_request
from app.core.settings import settings

SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}
CSRF_EXEMPT_PATHS = {"/api/auth/login/google", "/api/auth/refresh", "/api/auth/logout"}


class CSRFMiddleware(BaseHTTPMiddleware):
    """Require CSRF token for authenticated mutating requests only."""

    async def dispatch(self, request: Request, call_next):
        if request.method.upper() not in SAFE_METHODS:
            if request.url.path not in CSRF_EXEMPT_PATHS:
                has_auth = request.cookies.get(settings.AUTH_COOKIE_NAME)
                has_csrf = request.cookies.get(settings.CSRF_COOKIE_NAME)
                if has_auth and has_csrf:
                    validate_csrf_request(request)
        return await call_next(request)
