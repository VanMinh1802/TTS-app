"""R2 storage service for signed URL generation."""
import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from app.core.settings import settings, get_r2_public_base_url, get_r2_client_endpoint
from app.core.exceptions import NotFoundError, StorageError

logger = logging.getLogger(__name__)


class R2Service:
    """Cloudflare R2 storage service."""

    def __init__(self):
        self._client: Optional[boto3.client] = None
        self._models_cache: Optional[dict] = None

    def _public_base_url(self) -> str:
        return get_r2_public_base_url()

    def _client_endpoint_url(self) -> str:
        return get_r2_client_endpoint()

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
                endpoint_url=self._client_endpoint_url(),
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
            raise NotFoundError(f"Model not found: {model_id}")

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
            raise StorageError("Failed to generate download URL") from e

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
            raise StorageError("Failed to generate upload URL") from e

        return {
            "upload_url": upload_data["url"],
            "expires_in": settings.SIGNED_URL_EXPIRE_SECONDS,
            "fields": upload_data["fields"],
            "user_id": user_id,
        }

    def get_object(self, key: str) -> Optional[bytes]:
        """Get object from R2 by key."""
        try:
            response = self.client.get_object(Bucket=settings.R2_BUCKET_NAME, Key=key)
            return response["Body"].read()
        except ClientError:
            return None


class R2LibraryService:
    """Cloudflare R2 service for user audio library storage."""

    def __init__(self):
        self._client: Optional[boto3.client] = None

    @property
    def bucket_name(self) -> str:
        return settings.R2_LIBRARY_BUCKET_NAME

    @property
    def client(self) -> boto3.client:
        """Get or create R2 library client."""
        if self._client is None:
            config = Config(
                signature_version="s3v4",
                region_name="auto",
            )
            endpoint = f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
            self._client = boto3.client(
                "s3",
                aws_access_key_id=settings.R2_LIBRARY_ACCESS_KEY_ID or settings.R2_ACCESS_KEY_ID,
                aws_secret_access_key=settings.R2_LIBRARY_SECRET_ACCESS_KEY or settings.R2_SECRET_ACCESS_KEY,
                endpoint_url=endpoint,
                config=config,
            )
        return self._client

    def upload_file(self, file_bytes: bytes, object_name: str, content_type: str = "audio/wav") -> None:
        """Upload file bytes to R2."""
        self.client.put_object(
            Bucket=self.bucket_name,
            Key=object_name,
            Body=file_bytes,
            ContentType=content_type,
        )

    def get_public_url(self, object_name: str) -> str:
        """Get public URL for an object using the R2.dev public base URL."""
        public_base = settings.R2_LIBRARY_PUBLIC_URL or f"https://pub-{settings.R2_ACCOUNT_ID}.r2.dev"
        return f"{public_base}/{object_name}"

    def delete_file(self, object_name: str) -> None:
        """Delete file from R2."""
        self.client.delete_object(
            Bucket=self.bucket_name,
            Key=object_name,
        )


r2_service = R2Service()
r2_library_service = R2LibraryService()
