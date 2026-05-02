"""Authentication API endpoints."""
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Header, Request, Response, status, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ServiceError
from app.core.settings import settings
from app.db import get_db
from app.models.license import LicenseKey
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


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.AUTH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
        path=settings.AUTH_COOKIE_PATH,
        max_age=settings.AUTH_COOKIE_MAX_AGE,
    )


def _set_csrf_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.CSRF_COOKIE_NAME,
        value=token,
        httponly=False,
        secure=settings.CSRF_COOKIE_SECURE,
        samesite=settings.CSRF_COOKIE_SAMESITE,
        path=settings.CSRF_COOKIE_PATH,
        max_age=settings.CSRF_COOKIE_MAX_AGE,
    )


def _clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.AUTH_COOKIE_NAME,
        path=settings.AUTH_COOKIE_PATH,
    )
    response.delete_cookie(
        key=settings.CSRF_COOKIE_NAME,
        path=settings.CSRF_COOKIE_PATH,
    )


def get_current_user(
    request: Request,
    authorization: Annotated[Optional[str], Header()] = None,
    x_api_key: Annotated[Optional[str], Header()] = None,
    db: Session = Depends(get_db),
) -> User:
    """Get current user from cookie, authorization header, or API key."""
    auth_service = AuthService(db)

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
        user = auth_service.validate_api_key(x_api_key)
        if user:
            request.state.user = user
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


@router.post("/login/google", response_model=TokenResponse)
async def login_google(
    request: GoogleLoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    """Login with Google OAuth credential."""
    auth_service = AuthService(db)
    token_response = await auth_service.google_login(request.credential)
    _set_auth_cookie(response, token_response.access_token)
    csrf_token = auth_service.issue_csrf_token()
    _set_csrf_cookie(response, csrf_token)
    return token_response


@router.get("/csrf")
def get_csrf_token(response: Response, db: Session = Depends(get_db)):
    """Issue or rotate a CSRF token for the current browser session."""
    auth_service = AuthService(db)
    csrf_token = auth_service.issue_csrf_token()
    _set_csrf_cookie(response, csrf_token)
    return {"csrf_token": csrf_token}


@router.get("/me", response_model=dict)
def get_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user info."""
    # Get the most recent activated license for this user
    activated_at = None
    latest_license = db.execute(
        select(LicenseKey)
        .where(LicenseKey.used_by_id == user.id, LicenseKey.is_used == True)
        .order_by(LicenseKey.used_at.desc())
        .limit(1)
    ).scalar_one_or_none()
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
    db: Session = Depends(get_db),
):
    """Create a new API key."""
    auth_service = AuthService(db)
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
    db: Session = Depends(get_db),
):
    """List user's API keys with pagination."""
    auth_service = AuthService(db)
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
    db: Session = Depends(get_db),
):
    """Revoke an API key."""
    auth_service = AuthService(db)
    auth_service.revoke_api_key(user, key_id)
    return {"status": "revoked"}


@router.post("/logout")
def logout(response: Response):
    """Clear authentication cookie."""
    _clear_auth_cookie(response)
    return {"status": "logged_out"}
    return {"status": "revoked"}