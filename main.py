"""
Piper TTS FastAPI Backend
Vietnamese Text-to-Speech API with Vietnamese text processing
"""

import os
import base64
import io
import wave
import json
from typing import Optional
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

app = FastAPI(
    title="Vietnamese TTS API",
    description="Piper TTS with Vietnamese text processing",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============== Vietnamese Text Processing ==============


def number_to_vietnamese(n: int) -> str:
    """Convert number to Vietnamese words"""
    if n == 0:
        return "không"

    units = ["", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"]
    tens = [
        "",
        "mười",
        "hai mươi",
        "ba mươi",
        "bốn mươi",
        "năm mươi",
        "sáu mươi",
        "bảy mươi",
        "tám mươi",
        "chín mươi",
    ]

    if n < 10:
        return units[n]
    elif n < 20:
        if n == 15:
            return "mười lăm"
        return f"mười {units[n - 10]}"
    elif n < 100:
        ten = n // 10
        unit = n % 10
        if unit == 0:
            return tens[ten]
        elif unit == 5:
            return f"{tens[ten]} lăm"
        elif unit == 1:
            return f"{tens[ten]} mốt"
        else:
            return f"{tens[ten]} {units[unit]}"
    elif n < 1000:
        hundred = n // 100
        remainder = n % 100
        if remainder == 0:
            return f"{units[hundred]} trăm"
        return f"{units[hundred]} trăm {number_to_vietnamese(remainder)}"
    elif n < 1000000:
        thousand = n // 1000
        remainder = n % 1000
        if remainder == 0:
            return f"{number_to_vietnamese(thousand)} nghìn"
        return (
            f"{number_to_vietnamese(thousand)} nghìn {number_to_vietnamese(remainder)}"
        )
    else:
        million = n // 1000000
        remainder = n % 1000000
        if remainder == 0:
            return f"{number_to_vietnamese(million)} triệu"
        return (
            f"{number_to_vietnamese(million)} triệu {number_to_vietnamese(remainder)}"
        )


def convert_date(text: str) -> str:
    """Convert date formats to Vietnamese"""
    import re

    # DD/MM/YYYY or DD-MM-YYYY
    pattern = r"(\d{1,2})[/-](\d{1,2})[/-](\d{4})"

    def replace_date(match):
        day = int(match.group(1))
        month = int(match.group(2))
        year = int(match.group(3))
        return f"ngày {number_to_vietnamese(day)} tháng {number_to_vietnamese(month)} năm {number_to_vietnamese(year)}"

    return re.sub(pattern, replace_date, text)


def convert_time(text: str) -> str:
    """Convert time formats to Vietnamese"""
    import re

    # HH:MM or HH:MM:SS
    pattern = r"(\d{1,2}):(\d{2})(?::(\d{2}))?"

    def replace_time(match):
        hour = int(match.group(1))
        minute = int(match.group(2))
        result = f"{number_to_vietnamese(hour)} giờ {number_to_vietnamese(minute)} phút"
        if match.group(3):
            second = int(match.group(3))
            result += f" {number_to_vietnamese(second)} giây"
        return result

    return re.sub(pattern, replace_time, text)


def convert_currency(text: str) -> str:
    """Convert currency to Vietnamese"""
    import re

    # VND: 150.000đ or 150,000đ
    pattern = r"(\d[\d.,]*)\s*đ"

    def replace_vnd(match):
        num_str = match.group(1).replace(".", "").replace(",", "")
        try:
            num = int(num_str)
            return f"{number_to_vietnamese(num)} đồng"
        except:
            return match.group(0)

    text = re.sub(pattern, replace_vnd, text)

    # USD
    pattern = r"\$[\d,]+\.?\d*"
    text = re.sub(r"\$(\d+)", r"\1 đô la", text)

    return text


def process_decimals(text: str) -> str:
    """Convert floating point numbers to Vietnamese"""
    import re
    
    def replace_decimal(match):
        integer_part = match.group(1)
        decimal_part = match.group(2)
        
        int_str = number_to_vietnamese(int(integer_part))
        
        dec_str = ""
        if decimal_part.startswith("0") and int(decimal_part) > 0:
            zeros = len(decimal_part) - len(str(int(decimal_part)))
            dec_str = "không " * zeros + number_to_vietnamese(int(decimal_part))
        elif int(decimal_part) == 0:
            dec_str = "không"
        else:
            dec_str = number_to_vietnamese(int(decimal_part))
            
        return f"{int_str} phẩy {dec_str}"

    return re.sub(r"\b(\d+)[.,](\d+)\b", replace_decimal, text)


def process_units(text: str) -> str:
    """Expand common measurement units"""
    import re
    # Separate number and unit if stuck together (e.g. 8,75km -> 8,75 km)
    text = re.sub(r"(\d(?:[.,]\d+)?)(km|m|kg)\b", r"\1 \2", text, flags=re.IGNORECASE)
    
    # Replace common units
    text = re.sub(r"(?i)\bkm/giờ\b", "ki lô mét trên giờ", text)
    text = re.sub(r"(?i)\bkm/h\b", "ki lô mét trên giờ", text)
    text = re.sub(r"(?i)\bkm\b", "ki lô mét", text)
    # text = re.sub(r"(?i)\bm\b", "mét", text) # 'm' can be risky if it's a variable or part of math, but for TTS it's usually mét
    text = re.sub(r"(?i)(?<=\d)\s*m\b", " mét", text) # only match 'm' if preceded by a number
    text = re.sub(r"(?i)\bkg\b", "ki lô gam", text)
    
    return text


def process_codes(text: str) -> str:
    """Process document codes, slashes, and hyphens"""
    import re
    # Replace hyphen between Vietnamese words with "nối" (e.g. Bến Lức-Long Thành -> Bến Lức nối Long Thành)
    text = re.sub(r"(?<=[a-zA-Záàãạảăắằẵặẳâấầẫậẩđéèẽẹẻêếềễệểíìĩịỉóòõọỏôốồỗộổơớờỡợởúùũụủưứừữựửýỳỹỵỷ])-(?=[a-zA-Záàãạảăắằẵặẳâấầẫậẩđéèẽẹẻêếềễệểíìĩịỉóòõọỏôốồỗộổơớờỡợởúùũụủưứừữựửýỳỹỵỷ])", " nối ", text)
    
    # Separate mixed words (e.g. QH15 -> Q H 15, 1A -> 1 A)
    def split_alphanum(match):
        letters = match.group(1)
        numbers = match.group(2)
        spelled = " ".join(list(letters))
        return f"{spelled} {numbers}"
        
    text = re.sub(r"\b([a-zA-Z]+)(\d+)\b", split_alphanum, text)
    text = re.sub(r"\b(\d+)([a-zA-Z]+)\b", lambda m: f"{m.group(1)} {' '.join(list(m.group(2)))}", text)
    
    # Handle / inside words/numbers (like 57/2022/QH15 -> 57 xuyệt 2022 xuyệt Q H 15)
    text = re.sub(r"(?<=\d)/(?=\d)", " xuyệt ", text)
    text = re.sub(r"/(?=[a-zA-Z ])", " xuyệt ", text)
    text = re.sub(r"(?<=[a-zA-Z ])/(?=\d)", " xuyệt ", text)
    
    return text


def normalize_vietnamese(text: str) -> str:
    """Full Vietnamese text normalization pipeline"""
    import re
    import unicodedata

    text = process_units(text)
    text = process_codes(text)
    text = process_decimals(text)
    text = convert_date(text)
    text = convert_time(text)
    text = convert_currency(text)

    # Convert standalone numbers
    text = re.sub(r"\b(\d+)\b", lambda m: number_to_vietnamese(int(m.group(1))), text)

    # Add space after punctuation for better pauses
    text = re.sub(r"([.,!?;])", r"\1 ", text)
    text = re.sub(r"\s+", " ", text).strip()

    # Normalize unicode (NFC)
    text = unicodedata.normalize("NFC", text)

    return text


# ============== TTS Models ==============

MODELS_DIR = Path(os.getenv("MODELS_DIR", "models"))


# Auto-detect available voices from model directories
def detect_available_voices():
    """Auto-detect available voice models from subdirectories"""
    voices = {}
    if MODELS_DIR.exists():
        for item in MODELS_DIR.iterdir():
            if item.is_dir():
                # Find first .onnx file in the folder
                onnx_files = list(item.glob("*.onnx"))
                if not onnx_files:
                    continue

                onnx_file = onnx_files[0]
                model_file = onnx_file.name  # e.g., "baouyen_6463.onnx"

                # Find corresponding config file
                config_file_name = model_file.replace(".onnx", ".onnx.json")
                config_file = item / config_file_name

                # If config doesn't exist with same name, try to find any .onnx.json
                if not config_file.exists():
                    config_files = list(item.glob("*.onnx.json"))
                    if config_files:
                        config_file = config_files[0]
                        config_file_name = config_file.name

                gender = "female"
                try:
                    if config_file.exists():
                        with open(config_file, encoding="utf-8") as f:
                            config = json.load(f)
                except:
                    pass

                voices[item.name] = {
                    "name": item.name.replace("_", " ").title(),
                    "language": "vi",
                    "gender": gender,
                    "path": str(item),
                    "model_file": model_file,
                    "config_file": config_file_name,
                }
    return voices


AVAILABLE_VOICES = detect_available_voices()

# Cache for Piper TTS instances
_tts_cache = {}


# TTS model loader with detailed logging
def get_tts(voice: str):
    """Get or create cached TTS instance"""
    import logging

    logging.basicConfig(level=logging.DEBUG)

    if voice not in _tts_cache:
        voice_info = AVAILABLE_VOICES.get(voice)
        if not voice_info:
            raise FileNotFoundError(f"Voice not found: {voice}")

        # Use actual model file name from voice_info
        model_path = Path(voice_info["path"]) / voice_info["model_file"]
        config_path = Path(voice_info["path"]) / voice_info["config_file"]

        if not model_path.exists():
            raise FileNotFoundError(f"Model not found: {model_path}")

        print(f"[TTS] Loading model: {model_path}")

        from piper import PiperVoice

        voice_obj = PiperVoice.load(str(model_path))

        print(f"[TTS] Model loaded successfully for voice: {voice}")
        _tts_cache[voice] = voice_obj

    return _tts_cache[voice]


class TTSRequest(BaseModel):
    text: str
    voice: str = "banmai"
    speed: float = 1.0
    normalize: bool = True


@app.post("/api/tts/generate")
async def generate_speech(request: TTSRequest):
    """
    Generate speech from text
    """
    try:
        # Normalize Vietnamese text
        if request.normalize:
            text = normalize_vietnamese(request.text)
        else:
            text = request.text

        # Check voice exists
        if request.voice not in AVAILABLE_VOICES:
            raise HTTPException(
                status_code=400, detail=f"Voice '{request.voice}' not found"
            )

        # Get TTS instance (cached)
        tts = get_tts(request.voice)

        # Create synthesis config
        from piper.config import SynthesisConfig

        # length_scale: < 1 = faster, > 1 = slower
        syn_config = SynthesisConfig(length_scale=1.0 / request.speed)

        # Synthesize audio - returns iterable of AudioChunk
        audio_chunks = tts.synthesize(text, syn_config)

        # Collect all audio chunks
        import numpy as np

        all_samples = []
        try:
            for chunk in audio_chunks:
                if chunk.audio_int16_array is not None:
                    all_samples.append(chunk.audio_int16_array)
        except Exception as e:
            print(f"[TTS] Error collecting chunks: {e}")
            raise

        if not all_samples:
            raise Exception("No audio generated")

        # Concatenate all chunks
        try:
            audio = np.concatenate(all_samples)
        except Exception as e:
            print(f"[TTS] Error concatenating: {e}, samples count: {len(all_samples)}")
            raise

        # Get sample rate from voice config
        import json

        voice_info = AVAILABLE_VOICES.get(request.voice)
        config_path = Path(voice_info["path"]) / voice_info["config_file"]
        with open(config_path, encoding="utf-8") as f:
            config = json.load(f)
        sample_rate = config.get("audio", {}).get("sample_rate", 22050)

        # Convert to WAV bytes
        wav_io = io.BytesIO()
        with wave.open(wav_io, "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(audio.tobytes())

        wav_io.seek(0)

        return Response(
            content=wav_io.read(),
            media_type="audio/wav",
            headers={
                "Content-Disposition": f"inline; filename=speech.wav",
                "X-Voice": request.voice,
                "X-Speed": str(request.speed),
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        import traceback

        print(f"[TTS] Error: {e}")
        print(f"[TTS] Traceback: {traceback.format_exc()}")
        error_detail = f"{str(e)}\n{traceback.format_exc()}"
        raise HTTPException(status_code=500, detail=error_detail[:1000])


@app.get("/api/tts/voices")
async def get_voices():
    """Get available voices"""
    return {"voices": AVAILABLE_VOICES}


@app.get("/api/tts/voices/{voice_id}")
async def get_voice_info(voice_id: str):
    """Get specific voice info"""
    if voice_id not in AVAILABLE_VOICES:
        raise HTTPException(status_code=404, detail="Voice not found")
    return AVAILABLE_VOICES[voice_id]


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "TTS API"}


# Streaming endpoint for long text
@app.post("/api/tts/stream")
async def stream_speech(request: TTSRequest):
    """Stream TTS response (for long texts)"""
    # Similar to generate but with streaming
    return await generate_speech(request)
