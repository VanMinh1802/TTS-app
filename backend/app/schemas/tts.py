"""Pydantic schemas for TTS API."""
from typing import Optional
from pydantic import BaseModel, Field


class DictionaryEntry(BaseModel):
    """Single dictionary entry."""

    word: str = Field(..., description="Original word/text")
    pronunciation: str = Field(..., description="Custom pronunciation/output")
    priority: int = Field(default=1, description="Priority: higher = applied first")


class TTSRequest(BaseModel):
    """Request for TTS generation."""

    text: str
    voice_id: str = "vi_female"
    speed: float = 1.0
    # User custom dictionary - applied BEFORE backend normalization
    user_dictionary: Optional[list[DictionaryEntry]] = Field(
        default=None,
        description="User custom dictionary for text replacement"
    )


class TTSResponse(BaseModel):
    """Response for TTS generation."""

    audio_url: str
    duration: float
    voice_id: str
