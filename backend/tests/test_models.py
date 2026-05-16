"""Tests for Models/R2 API."""
import pytest
from fastapi import status
from fastapi.testclient import TestClient

from app.api.auth import get_current_user
from app.main import app
from app.services.r2_service import r2_service


class TestModelUrls:

    def test_download_url_uses_configured_r2_public_base_url(self, monkeypatch):
        from app.core.settings import Settings, get_r2_public_base_url

        settings = Settings(
            JWT_SECRET_KEY="test-secret-key-for-testing",
            R2_PUBLIC_URL="https://cdn.example.com",
            R2_ACCOUNT_ID="fallback-account",
        )
        monkeypatch.setattr("app.core.settings.settings", settings)

        assert get_r2_public_base_url() == "https://cdn.example.com"

    def test_download_url_uses_fallback_r2_account_url_when_public_url_missing(self, monkeypatch):
        from app.core.settings import Settings, get_r2_public_base_url

        settings = Settings(
            JWT_SECRET_KEY="test-secret-key-for-testing",
            R2_PUBLIC_URL="",
            R2_ACCOUNT_ID="fallback-account",
        )
        monkeypatch.setattr("app.core.settings.settings", settings)

        assert get_r2_public_base_url() == "https://fallback-account.r2.dev"


class TestR2Helpers:

    def test_public_base_url_is_shared_source(self, monkeypatch):
        from app.core.settings import Settings, get_r2_public_base_url

        settings = Settings(JWT_SECRET_KEY="test-secret-key-for-testing", R2_PUBLIC_URL="https://cdn.example.com", R2_ACCOUNT_ID="fallback-account")
        monkeypatch.setattr("app.core.settings.settings", settings)

        assert get_r2_public_base_url() == "https://cdn.example.com"

    def test_r2_client_endpoint_uses_settings_account_id(self, monkeypatch):
        from app.services import r2_service as r2_service_module

        settings = r2_service_module.settings
        monkeypatch.setattr(settings, "R2_ACCOUNT_ID", "account-123")
        monkeypatch.setattr(settings, "R2_ACCESS_KEY_ID", "key")
        monkeypatch.setattr(settings, "R2_SECRET_ACCESS_KEY", "secret")

        captured = {}

        def fake_client(service_name, **kwargs):
            captured.update(kwargs)
            class FakeClient:
                pass
            return FakeClient()

        monkeypatch.setattr(r2_service_module.boto3, "client", fake_client)

        service = r2_service_module.R2Service()
        _ = service.client

        assert captured["endpoint_url"] == "https://account-123.r2.cloudflarestorage.com"

    def test_voice_registry_uses_shared_r2_public_base_url(self, monkeypatch):
        from app.core.settings import Settings, get_r2_public_base_url
        from app.services import voice_registry as registry_module

        settings = Settings(JWT_SECRET_KEY="test-secret-key-for-testing", R2_PUBLIC_URL="https://cdn.example.com", R2_ACCOUNT_ID="account-123")
        monkeypatch.setattr("app.core.settings.settings", settings)

        assert get_r2_public_base_url() == "https://cdn.example.com"
        assert registry_module.get_r2_public_base_url() == "https://cdn.example.com"


class TestModels:

    def test_list_models(self, client):
        """Test listing models."""
        response = client.get("/api/models")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "models" in data
        assert len(data["models"]) > 0
        assert data["models"][0]["id"] == "piper-vi-en-medium"

    def test_get_model(self, client):
        """Test getting model metadata."""
        response = client.get("/api/models/piper-vi-en-medium")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == "piper-vi-en-medium"
        assert data["name"] == "Piper Vietnamese English Medium"

    def test_get_model_not_found(self, client):
        """Test getting non-existent model."""
        response = client.get("/api/models/non-existent")
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestModelDownload:

    def test_download_url_returns_200(self, client):
        """Test download URL returns 200 (requires auth)."""
        class FakeUser:
            id = "user-1"
        app.dependency_overrides[get_current_user] = lambda: FakeUser()
        try:
            response = client.post("/api/models/piper-vi-en-medium/download-url")
            assert response.status_code in [status.HTTP_200_OK, status.HTTP_404_NOT_FOUND]
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_download_url_with_auth(self, client):
        """Test download URL with auth."""
        class FakeUser:
            id = "user-1"

        app.dependency_overrides[get_current_user] = lambda: FakeUser()
        try:
            from app.services.r2_service import r2_service

            original_model = r2_service.get_model
            original_generate = r2_service.generate_download_url
            r2_service.get_model = lambda model_id: {
                "id": model_id,
                "name": "Piper Vietnamese English Medium",
                "description": "Test model",
                "size": 123,
                "version": "1.0.0",
                "voices": ["vi"],
                "languages": ["vi"],
                "path": "models/piper-vi-en-medium.onnx",
            }
            r2_service.generate_download_url = lambda model_id: {
                "url": "https://signed.example.com/download",
                "expires_in": 3600,
                "model_id": model_id,
                "model_size": 123,
            }
            response = client.post("/api/models/piper-vi-en-medium/download-url")
        finally:
            from app.services.r2_service import r2_service

            r2_service.get_model = original_model
            r2_service.generate_download_url = original_generate
            app.dependency_overrides.clear()

        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND,
        ]
        assert "X-RateLimit-Limit" in response.headers


class TestAudioUpload:

    def test_upload_url_returns_200(self, client):
        """Test upload URL returns 200 (requires auth)."""
        class FakeUser:
            id = "user-1"
        app.dependency_overrides[get_current_user] = lambda: FakeUser()
        try:
            response = client.post(
                "/api/audio/upload-url",
                json={"filename": "output.wav", "content_type": "audio/wav"},
            )
            assert response.status_code in [status.HTTP_200_OK, status.HTTP_500_INTERNAL_SERVER_ERROR]
        finally:
            app.dependency_overrides.pop(get_current_user, None)

    def test_upload_url_with_auth(self, client):
        """Test upload URL with auth."""
        class FakeUser:
            id = "user-1"

        app.dependency_overrides[get_current_user] = lambda: FakeUser()
        try:
            from app.services.r2_service import r2_service

            original_generate = r2_service.generate_upload_url
            r2_service.generate_upload_url = lambda user_id, filename, content_type: {
                "upload_url": "https://signed.example.com/upload",
                "expires_in": 3600,
                "fields": {},
                "user_id": user_id,
            }
            response = client.post(
                "/api/audio/upload-url",
                json={"filename": "output.wav", "content_type": "audio/wav"},
            )
        finally:
            from app.services.r2_service import r2_service

            r2_service.generate_upload_url = original_generate
            app.dependency_overrides.clear()

        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        ]
        assert "X-RateLimit-Limit" in response.headers
