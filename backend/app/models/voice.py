from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime
from typing import Optional
from app.models import Base

class Voice(Base):
    __tablename__ = "voices"
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    language = Column(String, default="vi")
    gender = Column(String, default="neutral")
    is_custom = Column(Boolean, default=False)
    owner_id = Column(String, nullable=True)
    model_url = Column(String, nullable=True)
    config_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, nullable=True, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=True, default=datetime.utcnow)