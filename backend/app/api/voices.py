"""Voice Library API routes."""
from __future__ import annotations

from functools import lru_cache
from typing import List

from fastapi import APIRouter, HTTPException

from app.schemas.voice import VoiceResponse
from app.services.voice_registry import (
    build_voice_cache_from_registry,
    load_default_voice_registry,
)

router = APIRouter(prefix="/voices", tags=["Voice Library"])


@lru_cache(maxsize=1)
def _get_voice_cache() -> dict[str, dict]:
    registry = load_default_voice_registry()
    return build_voice_cache_from_registry(registry)


def _get_voice_cache_values() -> list[dict]:
    return list(_get_voice_cache().values())


@router.get("", response_model=List[VoiceResponse])
async def list_voices(language: str = None, gender: str = None, is_custom: bool = None):
    """List all available voices."""
    voices = _get_voice_cache_values()

    if language:
        voices = [voice for voice in voices if voice.get("language") == language]
    if gender:
        voices = [voice for voice in voices if voice.get("gender") == gender]
    if is_custom is not None:
        voices = [voice for voice in voices if voice.get("is_custom") == is_custom]

    return voices


@router.get("/{voice_id}", response_model=VoiceResponse)
async def get_voice(voice_id: str):
    """Get a specific voice by ID."""
    voice = _get_voice_cache().get(voice_id)
    if not voice:
        raise HTTPException(status_code=404, detail="Voice not found")
    return voice


@router.get("/{voice_id}/sample")
async def get_voice_sample(voice_id: str):
    """Get sample audio for a voice."""
    from app.services.r2_service import r2_service
    
    voice = _get_voice_cache().get(voice_id)
    if not voice:
        raise HTTPException(status_code=404, detail="Voice not found")
    
    folder = voice.get("folder", voice_id)
    sample_key = f"vi/{folder}/sample.wav"
    
    try:
        audio_data = r2_service.get_object(sample_key)
        if not audio_data:
            raise HTTPException(status_code=404, detail="Sample not found")
        
        from fastapi.responses import Response
        return Response(
            content=audio_data,
            media_type="audio/wav",
            headers={"Content-Disposition": f'inline; filename="{voice_id}-sample.wav"'},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load sample: {str(e)}")
