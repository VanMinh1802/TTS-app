"""R2 storage service for signed URL generation."""
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from app.core.settings import settings

logger = logging.getLogger(__name__)


class R2Service:
    """Cloudflare R2 storage service."""

    def __init__(self):
        self._client: Optional[boto3.client] = None
        self._models_cache: Optional[dict] = None

    @property
    def client(self) -> boto3.client:
        """Get or create R2 client."""
        if self._client is None:
            config = Config(
                signature_version="s3v4",
                region_name="auto",
            )
            self._client = boto3.client(
                "s3",
                aws_access_key_id=settings.R2_ACCESS_KEY_ID,
                aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
                endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestream.com",
                config=config,
            )
        return self._client

    def get_models(self) -> list[dict]:
        """Get list of available models from config."""
        if self._models_cache is None:
            config_path = Path(__file__).parent.parent / "config" / "models.json"
            if config_path.exists():
                with open(config_path) as f:
                    data = json.load(f)
                    self._models_cache = data.get("models", [])
            else:
                self._models_cache = []
        return self._models_cache

    def get_model(self, model_id: str) -> Optional[dict]:
        """Get model by ID."""
        models = self.get_models()
        for model in models:
            if model["id"] == model_id:
                return model
        return None

    def generate_download_url(self, model_id: str) -> dict:
        """Generate signed URL for model download."""
        model = self.get_model(model_id)
        if not model:
            raise ValueError(f"Model not found: {model_id}")

        key = model["path"]
        expires = datetime.utcnow() + timedelta(seconds=settings.SIGNED_URL_EXPIRE_SECONDS)

        try:
            url = self.client.generate_presigned_url(
                "get_object",
                Params={
                    "Bucket": settings.R2_BUCKET_NAME,
                    "Key": key,
                },
                ExpiresIn=settings.SIGNED_URL_EXPIRE_SECONDS,
            )
        except ClientError as e:
            logger.error(f"R2 error: {e}")
            raise ValueError("Failed to generate download URL") from e

        return {
            "url": url,
            "expires_in": settings.SIGNED_URL_EXPIRE_SECONDS,
            "model_id": model_id,
            "model_size": model["size"],
        }

    def generate_upload_url(self, user_id: str, filename: str, content_type: str) -> dict:
        """Generate signed URL for audio upload."""
        key = f"audio/{user_id}/{filename}"
        fields = {
            "key": key,
            "Content-Type": content_type,
        }
        expires = datetime.utcnow() + timedelta(seconds=settings.SIGNED_URL_EXPIRE_SECONDS)

        try:
            upload_data = self.client.generate_presigned_post(
                Bucket=settings.R2_BUCKET_NAME,
                Key=key,
                Fields=fields,
                Conditions=[
                    {"Content-Type": content_type},
                    {"Content-Length": 104857600},  # 100MB limit
                ],
                ExpiresIn=settings.SIGNED_URL_EXPIRE_SECONDS,
            )
        except ClientError as e:
            logger.error(f"R2 error: {e}")
            raise ValueError("Failed to generate upload URL") from e

        return {
            "upload_url": upload_data["url"],
            "expires_in": settings.SIGNED_URL_EXPIRE_SECONDS,
            "fields": upload_data["fields"],
            "user_id": user_id,
        }


r2_service = R2Service()