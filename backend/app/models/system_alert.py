import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, JSON
from app.models import Base

class SystemAlert(Base):
    __tablename__ = "system_alerts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    severity = Column(String, index=True, nullable=False)
    message = Column(String, nullable=False)
    details = Column(JSON, nullable=True)
    is_read = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
