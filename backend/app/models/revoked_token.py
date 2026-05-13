"""Revoked token model for blacklist persistence."""
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime
from app.models import Base

class RevokedToken(Base):
    """Table to store revoked JWT IDs (JTI) for blacklist persistence."""
    __tablename__ = "revoked_tokens"

    jti = Column(String(36), primary_key=True)
    revoked_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
