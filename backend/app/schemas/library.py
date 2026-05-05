"""Library API schemas."""
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AudioRecordResponse(BaseModel):
    """Response schema for an audio record."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    voice_id: str
    text_content: str
    file_url: str
    file_size_bytes: int
    duration: float | None = None
    created_at: datetime


class LibraryListResponse(BaseModel):
    """Response schema for library list."""

    items: list[AudioRecordResponse]
    total: int = 0
    page: int = 1
    per_page: int = 50
