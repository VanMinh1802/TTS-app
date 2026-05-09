"""Authentication schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class GoogleLoginRequest(BaseModel):
    """Schema for Google OAuth login."""

    credential: str


class TokenResponse(BaseModel):
    """Schema for token response."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int


class APIKeyCreate(BaseModel):
    """Schema for creating an API key."""

    name: str = Field(..., min_length=1, max_length=255)
    rate_limit: int = Field(default=100, ge=10, le=10000)
    rate_limit_window: int = Field(default=60, ge=1, le=3600)
    expires_in_days: int = Field(default=30, ge=1, le=365)
    scopes: Optional[str] = Field(default="models:read,tts:generate")


class APIKeyResponse(BaseModel):
    """Schema for API key response."""

    id: str
    name: str
    rate_limit: int
    rate_limit_window: int
    expires_at: Optional[datetime]
    scopes: str
    total_requests: int
    failed_requests: int
    created_at: datetime
    last_used_at: Optional[datetime]
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class APIKeyCreateResponse(APIKeyResponse):
    """Schema for API key response with full key (shown once)."""

    key: str


class APIKeyListResponse(BaseModel):
    """Schema for paginated API key list response."""

    items: list[APIKeyResponse]
    total: int
    limit: int
    offset: int
