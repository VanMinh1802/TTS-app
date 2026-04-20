"""Language Detection API routes."""
from fastapi import APIRouter, HTTPException, status

from app.schemas.language import DetectRequest, DetectResponse, LanguageSegment
from app.services.language_detector import detect_language

router = APIRouter(prefix="/tts", tags=["Language Detection"])


@router.post("/detect-language", response_model=DetectResponse)
async def detect_language_endpoint(request: DetectRequest):
    """Detect language and return segments."""
    if not request.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text cannot be empty"
        )
    
    try:
        language, confidence, segments = detect_language(request.text)
        
        # Convert segments to response format
        segment_objs = []
        pos = 0
        for seg in segments:
            seg_text = seg["text"]
            end_pos = pos + len(seg_text)
            segment_objs.append(
                LanguageSegment(
                    text=seg_text,
                    language=seg["language"],
                    start_pos=seg["start_pos"],
                    end_pos=end_pos,
                )
            )
            pos = end_pos
        
        return DetectResponse(
            language=language,
            confidence=confidence,
            segments=segment_objs,
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )