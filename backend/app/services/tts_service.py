"""TTS Service - Model registry and metadata management."""
import logging
from typing import Optional

from app.services.voice_registry import (
    build_tts_model_map_from_registry,
    load_default_voice_registry,
    FREE_VOICE_IDS,
)

logger = logging.getLogger(__name__)

def _load_models() -> dict[str, dict]:
    registry = load_default_voice_registry()
    return build_tts_model_map_from_registry(registry)

_MODELS_CACHE: Optional[dict[str, dict]] = None

def _get_models() -> dict[str, dict]:
    global _MODELS_CACHE
    if _MODELS_CACHE is None:
        _MODELS_CACHE = _load_models()
    return _MODELS_CACHE

VOICE_ALIASES = {
    "vi_female": "ngochuyen",
    "vi_male": "manhdung",
    "default": "ngochuyen",
}

DEFAULT_VOICE = "default"
