"""TTS API routes - Using Piper library."""
import base64

from fastapi import APIRouter

from app.schemas.tts import TTSRequest, TTSResponse
from app.services.tts_service import TTSService, tts_service, MODELS
from app.utils.text_utils import strip_emotion_tags

router = APIRouter(prefix="/tts", tags=["TTS"])


@router.post("/generate", response_model=TTSResponse)
async def generate_tts(request: TTSRequest):
    """Generate TTS audio using Piper model from R2.
    
    User dictionary is applied BEFORE backend normalization, allowing:
    - Override backend output
    - Add custom pronunciations for words backend doesn't handle
    """
    if request.voice_id not in MODELS:
        request.voice_id = "vi_female"

    # Ensure model is loaded
    await tts_service._ensure_model(request.voice_id)

    # Strip emotion tags before synthesis
    clean_text = strip_emotion_tags(request.text)

    # Synthesize with user dictionary
    wav_data, duration = tts_service.synthesize(
        text=clean_text,
        voice_id=request.voice_id,
        speed=request.speed,
        user_dictionary=request.user_dictionary,
        emotion_params=request.emotion_params,
    )

    # Return as base64 data URL
    audio_b64 = base64.b64encode(wav_data).decode('utf-8')
    audio_url = f"data:audio/wav;base64,{audio_b64}"

    return TTSResponse(
        audio_url=audio_url,
        duration=duration,
        voice_id=request.voice_id,
    )


@router.get("/voices")
async def list_voices():
    """List available voices."""
    return {
        "voices": [
            {
                "id": voice_id,
                "name": config["name"],
                "lang": "Vietnamese",
                "available": True,
            }
            for voice_id, config in MODELS.items()
        ]
    }