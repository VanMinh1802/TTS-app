"""Audio Record model for Library."""
import uuid
from datetime import datetime

from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.models import Base


class AudioRecord(Base):
    """Audio Record stored in Cloudflare R2."""
    
    __tablename__ = "audio_records"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    voice_id = Column(String(50), nullable=False)
    text_content = Column(Text, nullable=False)
    file_url = Column(String(512), nullable=False)
    file_size_bytes = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationship (assuming User model has back_populates if needed, but not strictly required here)
    user = relationship("User", backref="audio_records")
