"""Authentication API endpoints."""
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Header, Request, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.user import User
from app.schemas.auth import GoogleLoginRequest, TokenResponse, APIKeyCreate, APIKeyCreateResponse, APIKeyResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_current_user(
    request: Request,
    authorization: Annotated[Optional[str], Header()] = None,
    x_api_key: Annotated[Optional[str], Header()] = None,
    db: Session = Depends(get_db),
) -> User:
    """Get current user from authorization header. Requires valid auth."""
    from fastapi import HTTPException, status
    
    auth_service = AuthService(db)
    
    # Try Bearer token
    if authorization:
        if authorization.startswith("Bearer "):
            token = authorization[7:]
            try:
                user = auth_service.get_current_user(token)
                request.state.user = user
                return user
            except ValueError:
                pass
    
    # Try API key
    if x_api_key:
        user = auth_service.validate_api_key(x_api_key)
        if user:
            request.state.user = user
            return user
    
    # No valid auth - require login
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )


@router.post("/login/google", response_model=TokenResponse)
async def login_google(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Login with Google OAuth credential."""
    auth_service = AuthService(db)
    return await auth_service.google_login(request.credential)


@router.get("/me", response_model=dict)
def get_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user info."""
    from sqlalchemy import select
    from app.models.license import LicenseKey
    
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


@router.get("/api-keys", response_model=list[APIKeyResponse])
def list_api_keys(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List user's API keys."""
    auth_service = AuthService(db)
    api_keys = auth_service.list_api_keys(user)
    return [
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