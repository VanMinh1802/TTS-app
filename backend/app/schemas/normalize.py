"""Pydantic schemas for Text Normalization API."""
from pydantic import BaseModel, Field


class NormalizeRequest(BaseModel):
    """Request for text normalization."""

    text: str = Field(..., description="Text to normalize")
    mode: str = Field("standard", description="Normalization mode: minimal, standard, full")
    dialect: str = Field("mixed", description="Vietnamese dialect: northern, southern, mixed")


class NormalizeResponse(BaseModel):
    """Response for text normalization."""

    normalized_text: str
    original_length: int
    normalized_length: int
    processing_time_ms: float