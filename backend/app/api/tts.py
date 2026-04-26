"""TTS API routes - Using Piper library."""
import base64

from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.schemas.tts import TTSRequest, TTSResponse, NormalizationMeta
from app.services.tts_service import MODELS, VOICE_ALIASES, tts_service
from app.services.normalizer import normalize_vietnamese
from app.services.llm_normalizer import (
    needs_llm_normalization,
    llm_normalize,
    validate_gemini_key,
    LLM_STATUS_SUCCESS,
    LLM_STATUS_SKIPPED,
)
from app.utils.text_utils import cleanup_grammar
from fastapi import Depends, HTTPException
from app.api.auth import get_current_user
from app.models.user import User
from app.db import get_db
from sqlalchemy.orm import Session
from app.services.quota_service import QuotaService

router = APIRouter(prefix="/tts", tags=["TTS"])


# ── Validate key endpoint ────────────────────────────────────────────────────

class ValidateKeyRequest(BaseModel):
    api_key: str

class ValidateKeyResponse(BaseModel):
    valid: bool
    status: str
    message: str

_STATUS_MESSAGES = {
    LLM_STATUS_SUCCESS:        "✓ API key hợp lệ và hoạt động tốt",
    "invalid_key":             "✗ API key không hợp lệ hoặc đã bị thu hồi",
    "rate_limit":              "⚠ Đã đạt rate limit, vui lòng thử lại sau ít phút",
    "quota_exceeded":          "⚠ Đã hết quota, kiểm tra billing trên Google AI Studio",
    "error":                   "✗ Lỗi kết nối đến Gemini API",
}

@router.post("/validate-key", response_model=ValidateKeyResponse)
async def validate_key(body: ValidateKeyRequest):
    """Validate a Gemini API key without storing it."""
    is_valid, status = await validate_gemini_key(body.api_key)
    return ValidateKeyResponse(
        valid=is_valid,
        status=status,
        message=_STATUS_MESSAGES.get(status, "Trạng thái không xác định"),
    )


# ── Generate TTS ─────────────────────────────────────────────────────────────

@router.post("/generate", response_model=TTSResponse)
async def generate_tts(
    request: TTSRequest, 
    http_request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate TTS audio using Piper model from R2.

    Processing order:
    1. Apply user dictionary (BEFORE normalization)
    2. Rule-based normalization (always runs, fast)
    3. LLM normalization (only if X-LLM-API-Key header present AND text is complex)
    4. Grammar cleanup
    5. Synthesize with Piper
    """
    if request.voice_id not in MODELS and request.voice_id not in VOICE_ALIASES:
        request.voice_id = "vi_female"

    quota_service = QuotaService(db)
    char_count = len(request.text)

    # Check limits
    if not quota_service.check_quota(user.id, "api_calls", 1):
        raise HTTPException(status_code=429, detail="Bạn đã đạt giới hạn số lần gọi API trong ngày (API calls limit reached).")
        
    if not quota_service.check_quota(user.id, "characters", char_count):
        raise HTTPException(status_code=429, detail="Bạn đã hết số lượng ký tự trong tháng (Characters limit reached).")

    await tts_service._ensure_model(request.voice_id)

    # ── Step 1: User dictionary BEFORE normalization ──────────────────────
    text = tts_service._apply_user_dictionary(
        request.text,
        request.user_dictionary or [],
    )

    # ── Step 2: Rule-based normalization (always runs) ────────────────────
    try:
        normalized, _, _, _ = normalize_vietnamese(text, mode="standard")
    except Exception:
        normalized = text

    # ── Step 3: LLM normalization (optional, BYOK — Gemini) ──────────────
    llm_api_key = http_request.headers.get("X-LLM-API-Key", "").strip()
    
    # Check complexity AFTER rules have processed dates/currency
    is_complex = needs_llm_normalization(normalized)

    norm_mode = "rule_based"
    llm_status = LLM_STATUS_SKIPPED
    final_normalized = normalized

    if llm_api_key and is_complex:
        llm_result, llm_status = await llm_normalize(text=normalized, api_key=llm_api_key)
        final_normalized = llm_result
        norm_mode = "llm" if llm_status == LLM_STATUS_SUCCESS else "rule_based"

    # ── Step 4: Grammar cleanup ───────────────────────────────────────────
    cleaned = cleanup_grammar(final_normalized)

    # ── Step 5: Synthesize ────────────────────────────────────────────────
    wav_data, duration = tts_service.synthesize(
        text=cleaned,
        voice_id=request.voice_id,
        speed=request.speed,
        emotion_params=request.emotion_params,
    )

    audio_b64 = base64.b64encode(wav_data).decode("utf-8")
    audio_url = f"data:audio/wav;base64,{audio_b64}"

    # Consume quota after successful generation
    quota_service.consume_quota(user.id, "api_calls", 1)
    quota_service.consume_quota(user.id, "characters", char_count)

    return TTSResponse(
        audio_url=audio_url,
        duration=duration,
        voice_id=request.voice_id,
        normalization=NormalizationMeta(
            mode=norm_mode,
            llm_status=llm_status,
            text_was_complex=is_complex,
        ),
    )


@router.get("/voices")
async def list_voices():
    """List available voices."""
    canonical_voice_ids = [
        voice_id for voice_id in MODELS.keys()
        if voice_id not in {"default", "vi_female", "vi_male"}
    ]
    return {
        "voices": [
            {
                "id": voice_id,
                "name": MODELS[voice_id]["name"],
                "lang": "Vietnamese",
                "sample_url": MODELS[voice_id].get("sample_url"),
                "available": True,
            }
            for voice_id in canonical_voice_ids
        ]
    }
