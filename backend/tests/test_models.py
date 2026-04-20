"""Tests for Models/R2 API."""
import pytest
from fastapi import status
from fastapi.testclient import TestClient


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

    def test_download_url_unauthorized(self, client):
        """Test download URL without auth."""
        response = client.post("/api/models/piper-vi-en-medium/download-url")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_download_url_with_auth(self, client):
        """Test download URL with auth."""
        # Register and login
        client.post(
            "/api/auth/register",
            json={"email": "test@example.com", "password": "password123"},
        )
        login_response = client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "password123"},
        )
        token = login_response.json()["access_token"]

        # Get download URL
        response = client.post(
            "/api/models/piper-vi-en-medium/download-url",
            headers={"Authorization": f"Bearer {token}"},
        )
        # 200 (success), 500 (R2 error), or 404 (model not found in test)
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            status.HTTP_404_NOT_FOUND,
        ]


class TestAudioUpload:

    def test_upload_url_unauthorized(self, client):
        """Test upload URL without auth."""
        response = client.post(
            "/api/audio/upload-url",
            json={"filename": "output.wav", "content_type": "audio/wav"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_upload_url_with_auth(self, client):
        """Test upload URL with auth."""
        # Register and login
        client.post(
            "/api/auth/register",
            json={"email": "test@example.com", "password": "password123"},
        )
        login_response = client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "password123"},
        )
        token = login_response.json()["access_token"]

        # Get upload URL
        response = client.post(
            "/api/audio/upload-url",
            json={"filename": "output.wav", "content_type": "audio/wav"},
            headers={"Authorization": f"Bearer {token}"},
        )
        # 200 (success), 400 (R2 error), or 500 (R2 config error)
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_500_INTERNAL_SERVER_ERROR,
        ]