"""Library API schemas."""
from datetime import datetime

from pydantic import BaseModel, Field


class AudioRecordResponse(BaseModel):
    """Response schema for an audio record."""

    id: str
    user_id: str
    voice_id: str
    text_content: str
    file_url: str
    file_size_bytes: int
    created_at: datetime


class LibraryListResponse(BaseModel):
    """Response schema for library list."""

    items: list[AudioRecordResponse]
