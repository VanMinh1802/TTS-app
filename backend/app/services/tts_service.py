"""TTS Service - Using Piper library for ONNX-based TTS."""
import logging
import io
import struct
from typing import Optional

from botocore.config import Config

from app.schemas.tts import DictionaryEntry, EmotionParams
from app.services.voice_registry import build_tts_model_map_from_registry, load_default_voice_registry

logger = logging.getLogger(__name__)

SAMPLE_RATE = 22050
DEFAULT_NOISE_SCALE = 0.667
DEFAULT_SPEED = 1.0
FALLBACK_BASE_FREQ = 200
FALLBACK_CHARS_PER_SECOND = 10
MAX_SYNTHESIS_DURATION = 30.0
MIN_SYNTHESIS_DURATION = 0.5


def _load_models() -> dict[str, dict]:
    registry = load_default_voice_registry()
    return build_tts_model_map_from_registry(registry)


MODELS = _load_models()


def _get_models() -> dict[str, dict]:
    """Return the current TTS model registry."""
    return MODELS


def get_models() -> dict[str, dict]:
    """Public accessor for the current TTS model registry."""
    return MODELS


VOICE_ALIASES = {
    "vi_female": "ngochuyen",
    "vi_male": "manhdung",
    "default": "ngochuyen",
}

DEFAULT_VOICE = "default"
_piper_cache = {}


def _load_model_from_r2(voice_id: str) -> Optional[tuple[bytes, dict]]:
    """Load ONNX model and config from R2."""
    from app.core.settings import settings, get_r2_client_endpoint

    canonical_voice_id = VOICE_ALIASES.get(voice_id, voice_id)
    model_config = MODELS.get(canonical_voice_id) or MODELS.get(voice_id)
    if not model_config:
        return None
    model_path = model_config["path"]
    json_path = model_path + ".json"

    try:
        config = Config(signature_version="s3v4", region_name="auto")
        import boto3

        client = boto3.client(
            "s3",
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY or "",
            endpoint_url=get_r2_client_endpoint(),
            config=config,
        )

        model_url = client.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.R2_BUCKET_NAME, "Key": model_path},
            ExpiresIn=3600,
        )
        config_url = client.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.R2_BUCKET_NAME, "Key": json_path},
            ExpiresIn=3600,
        )

        import httpx

        model_resp = httpx.get(model_url, timeout=120.0)
        config_resp = httpx.get(config_url, timeout=30.0)

        if model_resp.status_code == 200 and config_resp.status_code == 200:
            return model_resp.content, config_resp.json()

    except Exception as e:
        logger.error(f"Failed to load model from R2: {e}")

    return None


def _get_piper_voice(voice_id: str):
    """Get or create PiperVoice instance."""
    if voice_id in _piper_cache:
        return _piper_cache[voice_id]

    result = _load_model_from_r2(voice_id)
    if not result:
        raise RuntimeError(f"Failed to load model: {voice_id}")

    model_data, config_data = result
    import tempfile
    import os
    import json

    temp_dir = tempfile.mkdtemp(prefix="piper_")
    model_path = os.path.join(temp_dir, "voice.onnx")
    config_path = os.path.join(temp_dir, "voice.onnx.json")

    with open(model_path, "wb") as f:
        f.write(model_data)
    with open(config_path, "w") as f:
        json.dump(config_data, f)

    try:
        from piper import PiperVoice
        voice = PiperVoice.load(model_path)
        _piper_cache[voice_id] = {
            "voice": voice,
            "config": config_data,
            "model_path": model_path,
            "config_path": config_path,
            "temp_dir": temp_dir,
        }
        return _piper_cache[voice_id]
    except Exception as e:
        logger.exception("Failed to load PiperVoice")
        raise


class TTSService:
    """TTS service using Piper library."""

    async def _ensure_model(self, voice_id: str) -> bool:
        try:
            _get_piper_voice(voice_id)
            return True
        except Exception:
            return False

    def _apply_user_dictionary(self, text: str, user_dict: list[DictionaryEntry]) -> str:
        if not user_dict:
            return text

        sorted_entries = sorted(user_dict, key=lambda x: (x.priority, len(x.word)), reverse=True)
        result = text
        for entry in sorted_entries:
            if entry.word and entry.pronunciation:
                result = result.replace(entry.word, entry.pronunciation)
        return result

    def synthesize(
        self,
        text: str,
        voice_id: str = "vi_female",
        speed: float = 1.0,
        emotion_params: EmotionParams | None = None,
    ) -> tuple[bytes, float]:
        try:
            voice_data = _get_piper_voice(voice_id)
            voice = voice_data["voice"]
            config = voice_data["config"]

            from piper.config import SynthesisConfig
            if emotion_params:
                length_scale = emotion_params.length_scale
                noise_scale = emotion_params.noise_scale
            else:
                length_scale = 1.0 / speed
                noise_scale = DEFAULT_NOISE_SCALE
            syn_config = SynthesisConfig(length_scale=length_scale, noise_scale=noise_scale)

            audio_chunks = voice.synthesize(text, syn_config)
            import numpy as np
            all_samples = []
            for chunk in audio_chunks:
                if chunk.audio_int16_array is not None:
                    all_samples.append(chunk.audio_int16_array)

            if not all_samples:
                raise Exception("No audio generated")

            audio = np.concatenate(all_samples)
            sample_rate = config.get("audio", {}).get("sample_rate", SAMPLE_RATE)
            wav_data = self._audio_to_wav(audio, sample_rate)
            duration = len(audio) / sample_rate
            return wav_data, duration
        except Exception as e:
            logger.exception("Synthesis failed")
            return self._fallback_synthesize(text, speed)

    def _audio_to_wav(self, samples, sample_rate: int = SAMPLE_RATE) -> bytes:
        import numpy as np
        if samples.dtype != np.int16:
            samples = samples.astype(np.int16)
        return self._create_wav(samples.tobytes(), sample_rate)

    def _fallback_synthesize(self, text: str, speed: float = 1.0) -> tuple[bytes, float]:
        import math

        sample_rate = SAMPLE_RATE
        chars_per_second = FALLBACK_CHARS_PER_SECOND * speed
        duration = len(text) / chars_per_second
        duration = max(MIN_SYNTHESIS_DURATION, min(duration, MAX_SYNTHESIS_DURATION))

        num_samples = int(sample_rate * duration)
        samples = []
        base_freq = FALLBACK_BASE_FREQ
        for i in range(num_samples):
            t = i / sample_rate
            freq = base_freq + (50 * math.sin(2 * math.pi * 0.5 * t))
            sample = (
                0.5 * math.sin(2 * math.pi * freq * t)
                + 0.3 * math.sin(2 * math.pi * freq * 2 * t)
                + 0.1 * math.sin(2 * math.pi * freq * 3 * t)
            )
            envelope = 1.0
            fade_samples = int(0.1 * sample_rate)
            if i < fade_samples:
                envelope = i / fade_samples
            elif i > num_samples - fade_samples:
                envelope = (num_samples - i) / fade_samples
            sample = int(32767 * 0.6 * envelope * sample)
            samples.append(struct.pack("<h", sample))

        audio_data = b"".join(samples)
        return self._create_wav(audio_data, sample_rate), duration

    def _create_wav(self, audio_data: bytes, sample_rate: int = SAMPLE_RATE) -> bytes:
        channels = 1
        bits_per_sample = 16
        block_align = channels * (bits_per_sample // 8)
        byte_rate = sample_rate * block_align
        data_size = len(audio_data)
        file_size = 36 + data_size

        wav_header = struct.pack(
            "<4sI4s4sIHHIIHH4sI",
            b"RIFF",
            file_size - 8,
            b"WAVE",
            b"fmt ",
            16,
            1,
            channels,
            sample_rate,
            byte_rate,
            block_align,
            bits_per_sample,
            b"data",
            data_size,
        )
        return wav_header + audio_data


tts_service = TTSService()
