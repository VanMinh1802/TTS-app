"""User emotion dictionary Pydantic schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class UserEmotionDictBase(BaseModel):
    """Base user emotion dict schema."""
    emotion_key: str = Field(..., max_length=50)
    length_scale: float = Field(default=1.0, ge=0.5, le=2.0)
    noise_scale: float = Field(default=0.667, ge=0.3, le=1.0)


class UserEmotionDictCreate(UserEmotionDictBase):
    """Schema for creating user emotion dict."""
    pass


class UserEmotionDictUpdate(BaseModel):
    """Schema for updating user emotion dict."""
    length_scale: Optional[float] = Field(default=None, ge=0.5, le=2.0)
    noise_scale: Optional[float] = Field(default=None, ge=0.3, le=1.0)


class UserEmotionDictResponse(UserEmotionDictBase):
    """Schema for user emotion dict response."""
    id: str
    user_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
