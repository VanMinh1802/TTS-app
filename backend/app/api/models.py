"""Models API routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.db import get_db
from app.models.user import User
from app.schemas.r2 import (
    DownloadUrlResponse,
    ModelInfo,
    ModelsResponse,
    UploadUrlRequest,
    UploadUrlResponse,
)
from app.services.r2_service import r2_service

router = APIRouter(prefix="/models", tags=["Models"])


@router.get("", response_model=ModelsResponse)
def list_models():
    """List available TTS models."""
    models = r2_service.get_models()
    return ModelsResponse(
        models=[ModelInfo(**m) for m in models]
    )


@router.get("/{model_id}", response_model=ModelInfo)
def get_model(model_id: str):
    """Get model metadata."""
    model = r2_service.get_model(model_id)
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model not found: {model_id}",
        )
    return ModelInfo(**model)


@router.post("/{model_id}/download-url", response_model=DownloadUrlResponse)
def get_download_url(
    model_id: str,
    current_user: User = Depends(get_current_user),
):
    """Generate signed URL for model download."""
    try:
        result = r2_service.generate_download_url(model_id)
        return DownloadUrlResponse(**result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


router_audio = APIRouter(prefix="/audio", tags=["Audio"])


@router_audio.post("/upload-url", response_model=UploadUrlResponse)
def get_upload_url(
    request: UploadUrlRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate signed URL for audio upload."""
    try:
        result = r2_service.generate_upload_url(
            user_id=current_user.id,
            filename=request.filename,
            content_type=request.content_type,
        )
        return UploadUrlResponse(**result)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )