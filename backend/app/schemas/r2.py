"""Pydantic schemas for R2/Models API."""
from pydantic import BaseModel


class ModelInfo(BaseModel):
    """Model information."""

    id: str
    name: str
    description: str
    size: int
    version: str
    voices: list[str]
    languages: list[str]


class ModelsResponse(BaseModel):
    """Response for GET /api/models."""

    models: list[ModelInfo]


class DownloadUrlResponse(BaseModel):
    """Response for download URL endpoint."""

    url: str
    expires_in: int
    model_id: str
    model_size: int


class UploadUrlRequest(BaseModel):
    """Request for upload URL endpoint."""

    filename: str
    content_type: str = "audio/wav"


class UploadUrlResponse(BaseModel):
    """Response for upload URL endpoint."""

    upload_url: str
    expires_in: int
    fields: dict
    user_id: str