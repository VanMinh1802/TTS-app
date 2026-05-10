from pydantic import BaseModel
from typing import Optional
from datetime import datetime

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
    is_premium: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
