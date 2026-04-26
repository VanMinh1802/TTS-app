from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class VoiceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    language: str = Field(default="vi", pattern="^[a-z]{2}(-[A-Z]{2})?$")
    gender: str = Field(default="neutral", pattern="^(male|female|neutral)$")

class VoiceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    language: Optional[str] = Field(None, pattern="^[a-z]{2}(-[A-Z]{2})?$")
    gender: Optional[str] = Field(None, pattern="^(male|female|neutral)$")
    is_active: Optional[bool] = None

class VoiceResponse(BaseModel):
    id: str
    name: str
    language: str
    gender: str
    is_custom: bool = False
    owner_id: Optional[str] = None
    model_url: Optional[str] = None
    config_url: Optional[str] = None
    sample_url: Optional[str] = None
    folder: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
