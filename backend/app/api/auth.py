"""Authentication API endpoints."""
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Header, Request, Response, status, HTTPException, Query

from app.core.di import get_auth_service, get_uow
from app.core.uow import UnitOfWork
from app.core.exceptions import ServiceError
from app.core.settings import settings
from app.core.security import decode_token, create_access_token, create_refresh_token, create_csrf_token
from app.models.user import User
from app.schemas.auth import (
    APIKeyCreate,
    APIKeyCreateResponse,
    APIKeyListResponse,
    APIKeyResponse,
    GoogleLoginRequest,
    TokenResponse,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])

REFRESH_COOKIE_NAME = settings.REFRESH_COOKIE_NAME


def _set_auth_cookie(response: Response, token: str) -> None:
    """Set access_token as httpOnly cookie. Max-age matches JWT expiry."""
    response.set_cookie(
        key=settings.AUTH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
        path=settings.AUTH_COOKIE_PATH,
        max_age=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


def _set_csrf_cookie(response: Response, csrf_token: str) -> None:
    """Set csrf_token as readable cookie for double-submit pattern."""
    response.set_cookie(
        key=settings.CSRF_COOKIE_NAME,
        value=csrf_token,
        httponly=False,
        secure=settings.CSRF_COOKIE_SECURE,
        samesite=settings.CSRF_COOKIE_SAMESITE,
        path=settings.CSRF_COOKIE_PATH,
        max_age=settings.CSRF_COOKIE_MAX_AGE,
    )


def _set_refresh_cookie(response: Response, token: str) -> None:
    """Set refresh_token as httpOnly cookie. Max-age matches refresh expiry."""
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
        path="/api/auth",
        max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 86400,
    )


def _clear_auth_cookies(response: Response) -> None:
    """Clear all auth cookies."""
    response.delete_cookie(key=settings.AUTH_COOKIE_NAME, path=settings.AUTH_COOKIE_PATH)
    response.delete_cookie(key=REFRESH_COOKIE_NAME, path="/api/auth")
    response.delete_cookie(key=settings.CSRF_COOKIE_NAME, path=settings.CSRF_COOKIE_PATH)


def get_current_user(
    request: Request,
    authorization: Annotated[Optional[str], Header()] = None,
    x_api_key: Annotated[Optional[str], Header()] = None,
    auth_service: AuthService = Depends(get_auth_service),
) -> User:
    """Get current user from cookie, authorization header, or API key."""

    if authorization and x_api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either Bearer token or X-API-Key, not both.",
        )

    cookie_token = request.cookies.get(settings.AUTH_COOKIE_NAME)
    if cookie_token:
        try:
            user = auth_service.get_current_user(cookie_token)
            request.state.user = user
            return user
        except ServiceError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired session",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # Try Bearer token
    if authorization:
        if not authorization.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization scheme",
                headers={"WWW-Authenticate": "Bearer"},
            )
        token = authorization[7:]
        try:
            user = auth_service.get_current_user(token)
            request.state.user = user
            return user
        except ServiceError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # Try API key
    if x_api_key:
        user = auth_service.validate_api_key(x_api_key, path=request.url.path)
        if user:
            request.state.user = user
            key_id = x_api_key[4:].split(".", 1)[0]
            key = auth_service.uow.api_keys.get(key_id)
            if key:
                request.state.api_key_rate_limit = key.rate_limit
                request.state.api_key_rate_limit_window = key.rate_limit_window
            return user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # No valid auth - require login
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_optional_user(
    request: Request,
    authorization: Annotated[Optional[str], Header()] = None,
    x_api_key: Annotated[Optional[str], Header()] = None,
    auth_service: AuthService = Depends(get_auth_service),
) -> Optional[User]:
    """Get current user if authenticated, otherwise return None."""
    try:
        return get_current_user(request, authorization, x_api_key, auth_service)
    except HTTPException:
        return None


@router.post("/login/google", response_model=TokenResponse)
async def login_google(
    google_request: GoogleLoginRequest,
    response: Response,
    http_request: Request,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Login with Google OAuth credential. Issues access + refresh tokens."""
    from app.services.rate_limiter import check_login_rate_limit
    if not check_login_rate_limit(http_request):
        raise HTTPException(status_code=429, detail="Too many login attempts. Try again in a minute.")

    token_response = await auth_service.google_login(google_request.credential)

    # Set access_token cookie (short-lived)
    _set_auth_cookie(response, token_response.access_token)

    # Set CSRF protection cookie
    csrf_token = create_csrf_token()
    _set_csrf_cookie(response, csrf_token)

    # Issue and set refresh_token cookie (long-lived)
    payload = decode_token(token_response.access_token)
    if payload:
        refresh_token = create_refresh_token({"sub": payload["sub"], "email": payload.get("email")})
        _set_refresh_cookie(response, refresh_token)

    return token_response


@router.post("/refresh")
def refresh_token(
    request: Request,
    response: Response,
    uow: UnitOfWork = Depends(get_uow),
):
    """Refresh access token using refresh_token cookie. Implements token rotation."""
    refresh = request.cookies.get(REFRESH_COOKIE_NAME)
    if not refresh:
        raise HTTPException(status_code=401, detail="No refresh token")

    payload = decode_token(refresh)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    from app.core.token_blacklist import blacklist_refresh_token

    user_id = payload.get("sub")
    user = uow.users.get(user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    old_jti = payload.get("jti")
    if old_jti:
        blacklist_refresh_token(old_jti)

    # Token Rotation: issue new access + refresh tokens
    token_data = {"sub": user.id, "email": user.email}
    new_access = create_access_token(token_data)
    new_refresh = create_refresh_token(token_data)

    _set_auth_cookie(response, new_access)
    _set_csrf_cookie(response, create_csrf_token())
    _set_refresh_cookie(response, new_refresh)

    return {
        "access_token": new_access,
        "token_type": "bearer",
        "expires_in": settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


@router.get("/me", response_model=dict)
def get_me(user: User = Depends(get_current_user), uow: UnitOfWork = Depends(get_uow)):
    """Get current user info."""
    activated_at = None
    latest_license = uow.licenses.get_latest_used_by_user(user.id)
    if latest_license and latest_license.used_at:
        activated_at = latest_license.used_at.isoformat()

    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "subscription_tier": user.subscription_tier,
        "subscription_expires_at": user.subscription_expires_at.isoformat() if user.subscription_expires_at else None,
        "subscription_activated_at": activated_at,
        "is_admin": user.is_admin,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.post("/api-keys", response_model=APIKeyCreateResponse)
def create_api_key(
    key_data: APIKeyCreate,
    user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Create a new API key."""
    api_key, full_key = auth_service.create_api_key(user, key_data)
    return APIKeyCreateResponse(
        id=api_key.id,
        name=api_key.name,
        key=full_key,
        rate_limit=api_key.rate_limit,
        rate_limit_window=api_key.rate_limit_window,
        expires_at=api_key.expires_at,
        scopes=api_key.scopes,
        total_requests=api_key.total_requests,
        failed_requests=api_key.failed_requests,
        created_at=api_key.created_at,
        last_used_at=api_key.last_used_at,
        is_active=api_key.is_active,
    )


@router.get("/api-keys", response_model=APIKeyListResponse)
def list_api_keys(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
):
    """List user's API keys with pagination."""
    api_keys, total = auth_service.list_api_keys(user, limit=limit, offset=offset)

    items = [
        APIKeyResponse(
            id=k.id,
            name=k.name,
            rate_limit=k.rate_limit,
            rate_limit_window=k.rate_limit_window,
            expires_at=k.expires_at,
            scopes=k.scopes,
            total_requests=k.total_requests,
            failed_requests=k.failed_requests,
            created_at=k.created_at,
            last_used_at=k.last_used_at,
            is_active=k.is_active,
        )
        for k in api_keys
    ]

    return APIKeyListResponse(items=items, total=total, limit=limit, offset=offset)


@router.delete("/api-keys/{key_id}")
def revoke_api_key(
    key_id: str,
    user: User = Depends(get_current_user),
    auth_service: AuthService = Depends(get_auth_service),
):
    """Revoke an API key."""
    auth_service.revoke_api_key(user, key_id)
    return {"status": "revoked"}


@router.post("/logout")
def logout(request: Request, response: Response):
    """Clear all authentication cookies and blacklist tokens."""
    from app.core.token_blacklist import blacklist_access_token, blacklist_refresh_token

    token = request.cookies.get(settings.AUTH_COOKIE_NAME)
    if token:
        payload = decode_token(token)
        if payload and payload.get("jti"):
            blacklist_access_token(payload["jti"])

    refresh = request.cookies.get(REFRESH_COOKIE_NAME)
    if refresh:
        payload = decode_token(refresh)
        if payload and payload.get("jti"):
            blacklist_refresh_token(payload["jti"])

    _clear_auth_cookies(response)
    return {"status": "logged_out"}