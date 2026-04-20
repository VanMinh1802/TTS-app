"""Voice Library API routes."""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime

from app.schemas.voice import VoiceResponse
from app.core.settings import settings

router = APIRouter(prefix="/voices", tags=["Voice Library"])

# System voices - loaded from R2 or predefined
# User uploads voice model to R2 manually, then registers here
VOICES_CACHE: dict[str, dict] = {}

# Default system voices (loaded from existing models)
DEFAULT_VOICES = {}

def load_default_voices():
    """Load default voices from R2."""
    try:
        import boto3
        from botocore.config import Config
        
        config = Config(signature_version="s3v4", region_name="auto")
        client = boto3.client(
            "s3",
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY or "",
            endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
            config=config,
        )
        
        # List objects in voices folder
        response = client.list_objects_v2(
            Bucket=settings.R2_BUCKET_NAME,
            Prefix="voices/"
        )
        
        for obj in response.get('Contents', []):
            key = obj['Key']
            if key.endswith('.onnx.json'):
                # Extract voice path
                parts = key.split('/')
                if len(parts) >= 2:
                    voice_id = parts[-2]
                    config_url = f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/{settings.R2_BUCKET_NAME}/{key}"
                    model_url = key.replace('.onnx.json', '.onnx')
                    model_url = f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/{settings.R2_BUCKET_NAME}/{model_url}"
                    
                    now = datetime.utcnow()
                    VOICES_CACHE[voice_id] = {
                        "id": voice_id,
                        "name": voice_id.replace('_', ' ').title(),
                        "language": "vi",
                        "gender": "female",
                        "is_custom": True,
                        "owner_id": None,
                        "model_url": model_url,
                        "config_url": config_url,
                        "is_active": True,
                        "created_at": now,
                        "updated_at": now,
                    }
    except Exception as e:
        print(f"Failed to load voices from R2: {e}")
        
        # Add default fallback voice
        now = datetime.utcnow()
        if "vi_female" not in VOICES_CACHE:
            VOICES_CACHE["vi_female"] = {
                "id": "vi_female",
                "name": "Vietnamese Female",
                "language": "vi",
                "gender": "female",
                "is_custom": False,
                "owner_id": None,
                "model_url": "https://pub-86489e33a3f448f4b7dfcc0ec9dd3a49.r2.dev/vi/minhquang/minhquang.onnx",
                "config_url": "https://pub-86489e33a3f448f4b7dfcc0ec9dd3a49.r2.dev/vi/minhquang/minhquang.onnx.json",
                "is_active": True,
                "created_at": now,
                "updated_at": now,
            }

# Load voices on startup
load_default_voices()

# Add hardcoded demo voices if none loaded
if not VOICES_CACHE:
    now = datetime.utcnow()
    # These point to existing R2 models
    VOICES_CACHE["vi_female"] = {
        "id": "vi_female",
        "name": "Vietnamese Female (Minh Quang)",
        "language": "vi",
        "gender": "female",
        "is_custom": False,
        "owner_id": None,
        "model_url": "https://pub-86489e33a3f448f4b7dfcc0ec9dd3a49.r2.dev/vi/minhquang/minhquang.onnx",
        "config_url": "https://pub-86489e33a3f448f4b7dfcc0ec9dd3a49.r2.dev/vi/minhquang/minhquang.onnx.json",
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    VOICES_CACHE["vi_male"] = {
        "id": "vi_male", 
        "name": "Vietnamese Male",
        "language": "vi",
        "gender": "male",
        "is_custom": False,
        "owner_id": None,
        "model_url": "https://pub-86489e33a3f448f4b7dfcc0ec9dd3a49.r2.dev/vi/minhquang/minhquang.onnx",
        "config_url": "https://pub-86489e33a3f448f4b7dfcc0ec9dd3a49.r2.dev/vi/minhquang/minhquang.onnx.json",
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }

@router.get("", response_model=List[VoiceResponse])
async def list_voices(
    language: str = None,
    gender: str = None,
    is_custom: bool = None
):
    """List all available voices."""
    voices = list(VOICES_CACHE.values())
    
    if language:
        voices = [v for v in voices if v.get('language') == language]
    if gender:
        voices = [v for v in voices if v.get('gender') == gender]
    if is_custom is not None:
        voices = [v for v in voices if v.get('is_custom') == is_custom]
    
    return voices


@router.get("/{voice_id}", response_model=VoiceResponse)
async def get_voice(voice_id: str):
    """Get a specific voice by ID."""
    voice = VOICES_CACHE.get(voice_id)
    if not voice:
        raise HTTPException(status_code=404, detail="Voice not found")
    return voice
