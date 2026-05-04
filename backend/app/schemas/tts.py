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
    user_dictionary: Optional[list[DictionaryEntry]] = Field(
        default=None,
        description="User custom dictionary for text replacement"
    )


class NormalizationMeta(BaseModel):
    """Metadata about the text normalization step."""
    mode: str = Field(description="'llm' | 'rule_based'")
    llm_status: Optional[str] = Field(
        default=None,
        description="LLM call status: success | invalid_key | rate_limit | quota_exceeded | error | skipped"
    )
    text_was_complex: bool = Field(default=False)


class TTSResponse(BaseModel):
    """Response for TTS generation."""

    audio_url: str
    duration: float
    voice_id: str
    normalization: NormalizationMeta = Field(
        default_factory=lambda: NormalizationMeta(mode="rule_based", text_was_complex=False)
    )

class TermExtractionRequest(BaseModel):
    text: str

class Term(BaseModel):
    word: str
    pronunciation: str

class TermExtractionResponse(BaseModel):
    terms: list[Term]
