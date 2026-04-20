"""Text Normalization API routes."""
from fastapi import APIRouter, HTTPException, status

from app.schemas.normalize import NormalizeRequest, NormalizeResponse
from app.services.normalizer import normalize_vietnamese

router = APIRouter(prefix="/tts", tags=["Text Normalization"])


@router.post("/normalize", response_model=NormalizeResponse)
async def normalize_text(request: NormalizeRequest):
    """Normalize Vietnamese text for TTS."""
    # Validate mode
    valid_modes = ["minimal", "standard", "full"]
    if request.mode not in valid_modes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "INVALID_MODE",
                "detail": f"Invalid mode '{request.mode}'. Valid: {valid_modes}"
            }
        )

    # Validate dialect
    valid_dialects = ["northern", "southern", "mixed"]
    if request.dialect not in valid_dialects:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "INVALID_DIALECT", 
                "detail": f"Invalid dialect '{request.dialect}'. Valid: {valid_dialects}"
            }
        )

    # Validate input
    if not request.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "EMPTY_TEXT",
                "detail": "Input text cannot be empty"
            }
        )

    if len(request.text) > 10000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "TEXT_TOO_LONG",
                "detail": "Input text exceeds 10000 characters"
            }
        )

    try:
        normalized_text, original_len, normalized_len, proc_time = normalize_vietnamese(
            text=request.text,
            mode=request.mode,
            dialect=request.dialect
        )

        return NormalizeResponse(
            normalized_text=normalized_text,
            original_length=original_len,
            normalized_length=normalized_len,
            processing_time_ms=proc_time
        )

    except ValueError as e:
        error_code = str(e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": error_code,
                "detail": str(e)
            }
        )