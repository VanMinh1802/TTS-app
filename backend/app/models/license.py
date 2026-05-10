import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base

class LicenseKey(Base):
    """License key model for subscription upgrades."""

    __tablename__ = "license_keys"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    code_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    duration_days: Mapped[int] = mapped_column(Integer, default=30)
    tier: Mapped[str] = mapped_column(String(50), default="pro")
    
    is_used: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    used_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    used_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"))
    
    def __repr__(self) -> str:
        return f"<LicenseKey(code={self.code}, tier={self.tier}, used={self.is_used})>"
