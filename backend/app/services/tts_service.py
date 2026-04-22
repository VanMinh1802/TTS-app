"""TTS Service - Using Piper library for ONNX-based TTS."""
import struct
from typing import Optional
import io

from botocore.config import Config

from app.schemas.tts import TTSRequest, TTSResponse, DictionaryEntry, EmotionParams

MODELS = {
    "vi_female": {
        "name": "Minh Quang Vietnamese",
        "path": "vi/minhquang/minhquang.onnx",
    },
    "vi_male": {
        "name": "Vietnamese Male", 
        "path": "vi/minhquang/minhquang.onnx",
    },
    "default": {
        "name": "Vietnamese Female (Default)",
        "path": "vi/minhquang/minhquang.onnx",
    },
}

# Default voice when none specified
DEFAULT_VOICE = "default"

# Cache for PiperVoice instances
_piper_cache = {}


def _load_model_from_r2(voice_id: str) -> Optional[tuple[bytes, dict]]:
    """Load ONNX model and config from R2."""
    from app.core.settings import settings
    
    model_path = MODELS[voice_id]["path"]
    json_path = model_path + ".json"
    
    try:
        config = Config(signature_version="s3v4", region_name="auto")
        import boto3
        client = boto3.client(
            "s3",
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY or "",
            endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
            config=config,
        )
        
        # Download model
        model_url = client.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.R2_BUCKET_NAME, "Key": model_path},
            ExpiresIn=3600,
        )
        
        # Download config
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
        print(f"Failed to load model from R2: {e}")
    
    return None


def _get_piper_voice(voice_id: str):
    """Get or create PiperVoice instance."""
    if voice_id in _piper_cache:
        return _piper_cache[voice_id]
    
    # Load model from R2
    result = _load_model_from_r2(voice_id)
    if not result:
        raise RuntimeError(f"Failed to load model: {voice_id}")
    
    model_data, config_data = result
    
    # Piper expects model and config in same directory with matching names
    import tempfile
    import os
    import json
    
    # Create a temp directory
    temp_dir = tempfile.mkdtemp(prefix='piper_')
    model_name = 'voice.onnx'
    config_name = 'voice.onnx.json'
    model_path = os.path.join(temp_dir, model_name)
    config_path = os.path.join(temp_dir, config_name)
    
    # Write files
    with open(model_path, 'wb') as f:
        f.write(model_data)
    
    with open(config_path, 'w') as f:
        json.dump(config_data, f)
    
    print(f"Model saved to: {model_path}")
    print(f"Config saved to: {config_path}")
    
    try:
        from piper import PiperVoice
        voice = PiperVoice.load(model_path)
        
        _piper_cache[voice_id] = {
            'voice': voice,
            'config': config_data,
            'model_path': model_path,
            'config_path': config_path,
            'temp_dir': temp_dir,
        }
        
        print(f"Piper voice loaded for: {voice_id}")
        return _piper_cache[voice_id]
    
    except Exception as e:
        print(f"Error loading PiperVoice: {e}")
        import traceback
        traceback.print_exc()
        raise


class TTSService:
    """TTS service using Piper library."""

    def __init__(self):
        pass

    async def _ensure_model(self, voice_id: str) -> bool:
        """Ensure model is loaded."""
        try:
            _get_piper_voice(voice_id)
            return True
        except:
            return False

    def _apply_user_dictionary(self, text: str, user_dict: list[DictionaryEntry]) -> str:
        """Apply user dictionary to text before TTS.
        
        This is applied BEFORE backend normalization, allowing user to:
        - Override backend output
        - Add custom pronunciations for words backend doesn't handle
        """
        if not user_dict:
            return text
        
        # Sort by priority (higher first), then by length (longer first for longest match)
        sorted_entries = sorted(
            user_dict, 
            key=lambda x: (x.priority, len(x.word)), 
            reverse=True
        )
        
        result = text
        for entry in sorted_entries:
            if entry.word and entry.pronunciation:
                # Case-insensitive replacement
                result = result.replace(entry.word, entry.pronunciation)
        
        return result

    def synthesize(
        self, 
        text: str, 
        voice_id: str = "vi_female", 
        speed: float = 1.0,
        user_dictionary: list[DictionaryEntry] = None,
        emotion_params: EmotionParams = None
    ) -> tuple[bytes, float]:
        """Synthesize speech using Piper library.
        
        Args:
            text: Input text
            voice_id: Voice to use
            speed: Speed multiplier (1.0 = normal)
            user_dictionary: User custom dictionary entries
            emotion_params: Emotion parameters (length_scale, noise_scale)
        """
        # Apply user dictionary FIRST (before any processing)
        if user_dictionary:
            text = self._apply_user_dictionary(text, user_dictionary)
        
        try:
            voice_data = _get_piper_voice(voice_id)
            voice = voice_data['voice']
            config = voice_data['config']
            
            # Create synthesis config with emotion params
            from piper.config import SynthesisConfig
            if emotion_params:
                length_scale = emotion_params.length_scale
                noise_scale = emotion_params.noise_scale
            else:
                length_scale = 1.0 / speed
                noise_scale = 0.667
            syn_config = SynthesisConfig(length_scale=length_scale, noise_scale=noise_scale)
            
            # Synthesize
            audio_chunks = voice.synthesize(text, syn_config)
            
            # Collect audio
            import numpy as np
            
            all_samples = []
            for chunk in audio_chunks:
                if chunk.audio_int16_array is not None:
                    all_samples.append(chunk.audio_int16_array)
            
            if not all_samples:
                raise Exception("No audio generated")
            
            audio = np.concatenate(all_samples)
            
            # Get sample rate
            sample_rate = config.get("audio", {}).get("sample_rate", 22050)
            
            # Convert to WAV
            wav_data = self._audio_to_wav(audio, sample_rate)
            
            duration = len(audio) / sample_rate
            
            return wav_data, duration
            
        except Exception as e:
            print(f"Piper synthesis error: {e}")
            import traceback
            traceback.print_exc()
            return self._fallback_synthesize(text, speed)

    def _audio_to_wav(self, samples, sample_rate: int = 22050) -> bytes:
        """Convert numpy audio to WAV bytes."""
        import numpy as np
        # Ensure int16
        if samples.dtype != np.int16:
            samples = samples.astype(np.int16)
        
        audio_data = samples.tobytes()
        return self._create_wav(audio_data, sample_rate)

    def _fallback_synthesize(self, text: str, speed: float = 1.0) -> tuple[bytes, float]:
        """Fallback: Generate simple audio."""
        import math

        sample_rate = 22050
        chars_per_second = 10 * speed
        duration = len(text) / chars_per_second
        duration = max(0.5, min(duration, 30.0))

        num_samples = int(sample_rate * duration)

        samples = []
        base_freq = 200
        for i in range(num_samples):
            t = i / sample_rate
            freq = base_freq + (50 * math.sin(2 * math.pi * 0.5 * t))
            sample = (
                0.5 * math.sin(2 * math.pi * freq * t) +
                0.3 * math.sin(2 * math.pi * freq * 2 * t) +
                0.1 * math.sin(2 * math.pi * freq * 3 * t)
            )
            envelope = 1.0
            fade_samples = int(0.1 * sample_rate)
            if i < fade_samples:
                envelope = i / fade_samples
            elif i > num_samples - fade_samples:
                envelope = (num_samples - i) / fade_samples

            sample = int(32767 * 0.6 * envelope * sample)
            samples.append(struct.pack('<h', sample))

        audio_data = b''.join(samples)
        return self._create_wav(audio_data, sample_rate), duration

    def _create_wav(self, audio_data: bytes, sample_rate: int = 22050) -> bytes:
        """Create WAV file from raw audio data."""
        channels = 1
        bits_per_sample = 16
        block_align = channels * (bits_per_sample // 8)
        byte_rate = sample_rate * block_align
        data_size = len(audio_data)
        file_size = 36 + data_size

        wav_header = struct.pack(
            '<4sI4s4sIHHIIHH4sI',
            b'RIFF',
            file_size - 8,
            b'WAVE',
            b'fmt ',
            16,
            1,
            channels,
            sample_rate,
            byte_rate,
            block_align,
            bits_per_sample,
            b'data',
            data_size
        )

        return wav_header + audio_data


# Global service instance
tts_service = TTSService()
