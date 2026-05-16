"""Quota database models."""
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base

if TYPE_CHECKING:
    from app.models.user import User


class UserQuota(Base):
    """User quota tracking."""

    __tablename__ = "user_quotas"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, unique=True
    )
    tier: Mapped[str] = mapped_column(String(50), default="free")
    characters_used: Mapped[int] = mapped_column(Integer, default=0)
    characters_limit: Mapped[int] = mapped_column(Integer, default=5000)
    storage_used_mb: Mapped[int] = mapped_column(Integer, default=0)
    storage_limit_mb: Mapped[int] = mapped_column(Integer, default=100)
    api_calls_today: Mapped[int] = mapped_column(Integer, default=0)
    api_calls_limit: Mapped[int] = mapped_column(Integer, default=100)
    last_reset_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )

    def __repr__(self) -> str:
        return f"<UserQuota(user_id={self.user_id}, tier={self.tier})>"


class UsageHistory(Base):
    """Usage history tracking."""

    __tablename__ = "usage_history"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), nullable=False, index=True
    )
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False, index=True)
    characters_used: Mapped[int] = mapped_column(Integer, default=0)
    api_calls: Mapped[int] = mapped_column(Integer, default=0)
    storage_mb: Mapped[int] = mapped_column(Integer, default=0)

    def __repr__(self) -> str:
        return f"<UsageHistory(user_id={self.user_id}, date={self.date})>"