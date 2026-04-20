"""Authentication API routes."""
from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.user import User
from app.schemas.auth import (
    APIKeyCreate,
    APIKeyCreateResponse,
    APIKeyResponse,
    APIKeyUsageResponse,
    LoginRequest,
    TokenResponse,
    UserCreate,
    UserResponse,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_current_user(
    authorization: Annotated[Optional[str], Header()] = None,
    x_api_key: Annotated[Optional[str], Header()] = None,
    db: Session = Depends(get_db),
) -> User:
    """Get current authenticated user from token or API key."""
    service = AuthService(db)
    
    # Try Bearer token first
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        try:
            return service.get_current_user(token)
        except ValueError:
            pass
    
    # Try API key
    if x_api_key:
        user = service.validate_api_key(x_api_key)
        if user:
            return user
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
    )


# ===== Auth Endpoints =====


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user account."""
    service = AuthService(db)
    try:
        user = service.register(user_data)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )


@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Login and get access token."""
    service = AuthService(db)
    try:
        return service.login(login_data)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current user profile."""
    return current_user


# ===== API Key Endpoints =====


@router.post("/keys", response_model=APIKeyCreateResponse, status_code=status.HTTP_201_CREATED)
def create_api_key(
    key_data: APIKeyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new API key."""
    service = AuthService(db)
    api_key, full_key = service.create_api_key(current_user, key_data)
    return APIKeyCreateResponse(
        id=api_key.id,
        key=full_key,
        name=api_key.name,
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


@router.get("/keys", response_model=list[APIKeyResponse])
def list_api_keys(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all API keys for current user (masked keys)."""
    service = AuthService(db)
    keys = service.list_api_keys(current_user)
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
        for k in keys
    ]


@router.delete("/keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_api_key(
    key_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Revoke an API key."""
    service = AuthService(db)
    try:
        service.revoke_api_key(current_user, key_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get("/keys/{key_id}/usage", response_model=APIKeyUsageResponse)
def get_api_key_usage(
    key_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get usage stats for an API key."""
    service = AuthService(db)
    try:
        return service.get_api_key_usage(current_user, key_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
