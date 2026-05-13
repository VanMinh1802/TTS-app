"""TTS API routes - Client-side focused."""
import base64
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.auth import get_current_user, get_optional_user
from app.models.user import User
from app.services.tts_service import _get_models, FREE_VOICE_IDS

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tts", tags=["TTS"])

@router.get("/voices")
async def list_voices(user: Optional[User] = Depends(get_optional_user)):
    """List available voices with tier information for client-side synthesis."""
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
    """Utility to convert client-side WAV to MP3 for better sharing."""
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
        logger.error(f"MP3 conversion failed: {e}")
        raise HTTPException(status_code=500, detail=f"MP3 conversion failed: {str(e)}")

    mp3_b64 = base64.b64encode(mp3_bytes).decode("utf-8")
    return {
        "mp3_url": f"data:audio/mpeg;base64,{mp3_b64}",
        "size_bytes": len(mp3_bytes),
    }
