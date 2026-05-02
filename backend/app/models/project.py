"""Project, Scene, Segment database models."""
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, LargeBinary, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base

if TYPE_CHECKING:
    from app.models.user import User


class Project(Base):
    """Project entity - contains scenes and segments."""

    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow
    )

    scenes: Mapped[list["Scene"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    export_jobs: Mapped[list["ProjectExportJob"]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
    )


class Scene(Base):
    """Scene entity - contains segments within a project."""

    __tablename__ = "scenes"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    project: Mapped["Project"] = relationship(back_populates="scenes")
    segments: Mapped[list["Segment"]] = relationship(
        back_populates="scene", cascade="all, delete-orphan"
    )


class Segment(Base):
    """Segment entity - text content with voice for TTS generation."""

    __tablename__ = "segments"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    scene_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("scenes.id", ondelete="CASCADE"), nullable=False
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    voice_id: Mapped[str] = mapped_column(String(50), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    audio_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    emotion_params: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    scene: Mapped["Scene"] = relationship(back_populates="segments")


class ProjectExportJob(Base):
    """Project export job persisted in database."""

    __tablename__ = "project_export_jobs"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    export_format: Mapped[str] = mapped_column(String(32), nullable=False)
    gap_seconds: Mapped[float] = mapped_column(nullable=False, default=1.0, server_default="1.0")
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="processing",
        server_default="processing",
        index=True,
    )
    progress: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    payload_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    content_type: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    file_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    output_data: Mapped[Optional[bytes]] = mapped_column(LargeBinary, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    project: Mapped["Project"] = relationship(back_populates="export_jobs")
