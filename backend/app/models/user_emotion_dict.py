"""User custom emotion dictionary model."""
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models import Base

if TYPE_CHECKING:
    from app.models.user import User


class UserEmotionDict(Base):
    """User custom emotion parameters."""

    __tablename__ = "user_emotion_dicts"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    emotion_key: Mapped[str] = mapped_column(String(50), nullable=False)
    length_scale: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    noise_scale: Mapped[float] = mapped_column(Float, nullable=False, default=0.667)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
