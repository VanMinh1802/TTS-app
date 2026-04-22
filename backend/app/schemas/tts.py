"""Pydantic schemas for TTS API."""
from typing import Optional
from pydantic import BaseModel, Field


class DictionaryEntry(BaseModel):
    """Single dictionary entry."""

    word: str = Field(..., description="Original word/text")
    pronunciation: str = Field(..., description="Custom pronunciation/output")
    priority: int = Field(default=1, description="Priority: higher = applied first")


class EmotionParams(BaseModel):
    """Emotion parameters for TTS."""
    length_scale: float = Field(default=1.0, ge=0.5, le=2.0)
    noise_scale: float = Field(default=0.667, ge=0.3, le=1.0)


class TTSRequest(BaseModel):
    """Request for TTS generation."""

    text: str
    voice_id: str = "vi_female"
    speed: float = 1.0
    # Emotion parameters - applied after text cleaning
    emotion_params: Optional[EmotionParams] = Field(
        default=None,
        description="Emotion parameters for TTS synthesis"
    )
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
