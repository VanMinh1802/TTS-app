"""TTS API routes - Using Piper library."""
import asyncio
import base64
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from app.api.auth import get_current_user, get_optional_user
from app.core.messages import BACKEND_MESSAGES
from app.core.di import get_quota_service, get_analytics_service
from app.models.user import User
from app.services.quota_service import QuotaService
from app.services.analytics_service import AnalyticsService
from app.schemas.tts import (
    TTSRequest,
    TTSResponse,
)
from app.services.normalizer import normalize_vietnamese
from app.services.tts_service import VOICE_ALIASES, _get_models, _get_piper_voice, tts_service
from app.services.voice_registry import FREE_VOICE_IDS
from app.utils.text_utils import cleanup_grammar

PREMIUM_TIERS = {"pro", "enterprise"}

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tts", tags=["TTS"])
MAX_TEXT_LENGTH = 10_000


class PhonemizeRequest(BaseModel):
    text: str
    voice_id: str


class PhonemizeResponse(BaseModel):
    phoneme_ids: list[int]


@router.post("/phonemize", response_model=PhonemizeResponse)
async def phonemize_text(request: PhonemizeRequest):
    """Return phoneme IDs for client-side ONNX inference."""
    if len(request.text) > MAX_TEXT_LENGTH:
        raise HTTPException(status_code=400, detail=f"Văn bản quá dài. Tối đa {MAX_TEXT_LENGTH:,} ký tự.")

    await tts_service._ensure_model(request.voice_id)

    voice_data = _get_piper_voice(request.voice_id)
    if not voice_data:
        raise HTTPException(status_code=400, detail="Voice not found")

    voice = voice_data["voice"]
    config = voice_data["config"]
    phoneme_map = config.get("phoneme_id_map", {})
    phoneme_symbols = voice.phonemize(request.text)
    
    # Convert phoneme symbols → phoneme IDs using the model's map
    # Piper returns [[char, char, ...], ...] — each character is a phoneme symbol
    ids: list[int] = []
    for sentence in phoneme_symbols:
        for char in sentence:
            entry = phoneme_map.get(char)
            if entry and len(entry) > 0:
                ids.append(entry[0])
    
    if not ids:
        raise HTTPException(status_code=400, detail="Phonemization produced no valid IDs")
    
    return PhonemizeResponse(phoneme_ids=ids)


@router.post("/generate", response_model=TTSResponse)
async def generate_tts(
    request: TTSRequest,
    http_request: Request,
    user: User = Depends(get_current_user),
    quota_service: QuotaService = Depends(get_quota_service),
    analytics_service: AnalyticsService = Depends(get_analytics_service),
):
    """Generate TTS audio using Piper model from R2."""
    if len(request.text) > MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Văn bản quá dài. Giới hạn tối đa {MAX_TEXT_LENGTH:,} ký tự.",
        )

    models = _get_models()
    if request.voice_id not in models and request.voice_id not in VOICE_ALIASES:
        request.voice_id = "vi_female"

    resolved_voice_id = VOICE_ALIASES.get(request.voice_id, request.voice_id)
    if resolved_voice_id not in FREE_VOICE_IDS and user.subscription_tier not in PREMIUM_TIERS:
        raise HTTPException(
            status_code=403,
            detail="This voice requires a PRO subscription. Upgrade to access premium voices.",
        )

    char_count = len(request.text)

    if not quota_service.check_quota(user.id, "api_calls", 1):
        raise HTTPException(status_code=429, detail=BACKEND_MESSAGES["errors"]["api_calls_limit"])
    if not quota_service.check_quota(user.id, "characters", char_count):
        raise HTTPException(status_code=429, detail=BACKEND_MESSAGES["errors"]["characters_limit"])

    await tts_service._ensure_model(request.voice_id)

    text = tts_service._apply_user_dictionary(request.text, request.user_dictionary or [])

    try:
        normalized, _, _, _ = normalize_vietnamese(text)
    except ValueError:
        normalized = text

    cleaned = cleanup_grammar(normalized)

    wav_data, duration = await asyncio.to_thread(
        tts_service.synthesize,
        text=cleaned,
        voice_id=request.voice_id,
        speed=request.speed,
    )

    audio_b64 = base64.b64encode(wav_data).decode("utf-8")
    audio_url = f"data:audio/wav;base64,{audio_b64}"

    quota_service.consume_quota(user.id, "api_calls", 1)
    quota_service.consume_quota(user.id, "characters", char_count)

    analytics_service.update_usage(
        user_id=user.id,
        feature="tts",
        characters_used=char_count,
        api_calls=1,
    )

    return TTSResponse(
        audio_url=audio_url,
        duration=duration,
        voice_id=request.voice_id,
    )


@router.get("/voices")
async def list_voices(user: Optional[User] = Depends(get_optional_user)):
    """List available voices with tier information."""
    models = _get_models()
    canonical_voice_ids = [
        voice_id for voice_id in models.keys()
        if voice_id not in {"default", "vi_female", "vi_male"}
    ]
    return {
        "voices": [
            {
                "id": voice_id,
                "name": models[voice_id]["name"],
                "lang": "Vietnamese",
                "sample_url": models[voice_id].get("sample_url"),
                "available": True,
                "is_premium": voice_id not in FREE_VOICE_IDS,
                "model_key": models[voice_id].get("path", f"vi/{voice_id}/{voice_id}.onnx"),
                "updated_at": models[voice_id].get("updated_at", ""),
            }
            for voice_id in canonical_voice_ids
        ]
    }


class ConvertToMp3Request(BaseModel):
    audio_data: str  # base64 WAV data URL or raw base64


@router.post("/convert-to-mp3")
async def convert_to_mp3(
    req: ConvertToMp3Request,
    _user=Depends(get_current_user),
):
    from pydub import AudioSegment
    import io as _io

    raw = req.audio_data
    if raw.startswith("data:"):
        raw = raw.split(",", 1)[1]

    try:
        wav_bytes = base64.b64decode(raw)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 audio data")

    try:
        audio = AudioSegment.from_file(_io.BytesIO(wav_bytes), format="wav")
        mp3_buf = _io.BytesIO()
        audio.export(mp3_buf, format="mp3", bitrate="128k")
        mp3_bytes = mp3_buf.getvalue()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MP3 conversion failed: {str(e)}")

    mp3_b64 = base64.b64encode(mp3_bytes).decode("utf-8")
    return {
        "mp3_url": f"data:audio/mpeg;base64,{mp3_b64}",
        "size_bytes": len(mp3_bytes),
    }
