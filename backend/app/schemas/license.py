from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class LicenseGenerateRequest(BaseModel):
    duration_days: int = Field(..., gt=0, description="Duration of the license in days")
    tier: str = Field("pro", description="Subscription tier (pro, enterprise)")
    count: int = Field(1, gt=0, le=100, description="Number of keys to generate")

class LicenseActivateRequest(BaseModel):
    code: str = Field(..., description="The magic link code to activate")

class LicenseResponse(BaseModel):
    id: str
    code: str
    duration_days: int
    tier: str
    is_used: bool
    used_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
