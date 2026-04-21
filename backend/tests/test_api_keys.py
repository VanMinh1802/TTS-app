"""Tests for enhanced API key features."""
import pytest
from unittest.mock import patch
from fastapi import status


class TestAPIKeyEnhanced:

    @patch("app.services.auth_service.id_token.verify_oauth2_token")
    def test_create_key_with_options(self, mock_verify, client):
        """Test creating API key with all options."""
        mock_verify.return_value = {
            "email": "testoptions@example.com",
            "name": "Test Options"
        }
        login_response = client.post(
            "/api/auth/google",
            json={"credential": "mock_google_id_token"},
        )
        token = login_response.json()["access_token"]

        response = client.post(
            "/api/auth/keys",
            json={
                "name": "Full Features Key",
                "rate_limit": 200,
                "rate_limit_window": 120,
                "expires_in_days": 60,
                "scopes": "models:read,tts:generate",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["rate_limit"] == 200
        assert data["rate_limit_window"] == 120
        assert "expires_at" in data
        assert data["scopes"] == "models:read,tts:generate"
        assert "key" in data  # Full key shown once

    @patch("app.services.auth_service.id_token.verify_oauth2_token")
    def test_list_keys_masked(self, mock_verify, client):
        """Test listing keys shows masked data."""
        mock_verify.return_value = {
            "email": "testmask@example.com",
            "name": "Test Mask"
        }
        login_response = client.post(
            "/api/auth/google",
            json={"credential": "mock_google_id_token"},
        )
        token = login_response.json()["access_token"]

        # Create key
        client.post(
            "/api/auth/keys",
            json={"name": "Test Key"},
            headers={"Authorization": f"Bearer {token}"},
        )

        # List keys
        response = client.get(
            "/api/auth/keys",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        keys = response.json()
        assert len(keys) > 0
        # After creation, listing should not show full key
        assert "key" not in keys[0]

    @patch("app.services.auth_service.id_token.verify_oauth2_token")
    def test_get_key_usage(self, mock_verify, client):
        """Test getting API key usage stats."""
        mock_verify.return_value = {
            "email": "testusage@example.com",
            "name": "Test Usage"
        }
        login_response = client.post(
            "/api/auth/google",
            json={"credential": "mock_google_id_token"},
        )
        token = login_response.json()["access_token"]

        # Create key
        create_response = client.post(
            "/api/auth/keys",
            json={"name": "Test Key"},
            headers={"Authorization": f"Bearer {token}"},
        )
        key_id = create_response.json()["id"]

        # Get usage
        response = client.get(
            f"/api/auth/keys/{key_id}/usage",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "total_requests" in data
        assert "successful_requests" in data
        assert "failed_requests" in data