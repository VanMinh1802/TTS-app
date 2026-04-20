"""Pydantic schemas for Language Detection API."""
from pydantic import BaseModel


class LanguageSegment(BaseModel):
    """Text segment with detected language."""

    text: str
    language: str  # vietnamese, english, mixed
    start_pos: int
    end_pos: int


class DetectRequest(BaseModel):
    """Language detection request."""

    text: str


class DetectResponse(BaseModel):
    """Language detection response."""

    language: str  # vietnamese, english, mixed
    confidence: float
    segments: list[LanguageSegment]