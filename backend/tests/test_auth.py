"""Tests for authentication endpoints."""
import pytest
from unittest.mock import patch
from fastapi import status


class TestAuth:
    """Authentication endpoint tests."""

    @patch("app.services.auth_service.id_token.verify_oauth2_token")
    def test_google_login_new_user(self, mock_verify, client):
        """Test successful login and registration of a new user via Google."""
        mock_verify.return_value = {
            "email": "newuser@example.com",
            "name": "New User",
            "sub": "google12345"
        }
        
        response = client.post(
            "/api/auth/google",
            json={"credential": "mock_google_id_token"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    @patch("app.services.auth_service.id_token.verify_oauth2_token")
    def test_google_login_existing_user(self, mock_verify, client):
        """Test successful login of an existing user via Google."""
        mock_verify.return_value = {
            "email": "existinguser@example.com",
            "name": "Existing User",
            "sub": "google67890"
        }
        
        # First login (registers)
        client.post(
            "/api/auth/google",
            json={"credential": "mock_google_id_token"},
        )

        # Second login (existing)
        response = client.post(
            "/api/auth/google",
            json={"credential": "mock_google_id_token"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    @patch("app.services.auth_service.id_token.verify_oauth2_token")
    def test_google_login_invalid_token(self, mock_verify, client):
        """Test login with invalid Google credential."""
        mock_verify.side_effect = ValueError("Invalid token")
        
        response = client.post(
            "/api/auth/google",
            json={"credential": "invalid_token"},
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        assert "Invalid Google credentials" in str(response.json())

    def test_get_me_unauthorized(self, client):
        """Test getting current user without auth."""
        response = client.get("/api/auth/me")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @patch("app.services.auth_service.id_token.verify_oauth2_token")
    def test_get_me_success(self, mock_verify, client):
        """Test getting current user with auth."""
        mock_verify.return_value = {
            "email": "testme@example.com",
            "name": "Test Me",
            "sub": "googleabc"
        }
        
        # Login
        login_response = client.post(
            "/api/auth/google",
            json={"credential": "mock_google_id_token"},
        )
        token = login_response.json()["access_token"]

        # Get current user
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == "testme@example.com"
        assert data["name"] == "Test Me"


class TestAPIKeys:
    """API Key endpoint tests."""

    @patch("app.services.auth_service.id_token.verify_oauth2_token")
    def test_create_api_key(self, mock_verify, client):
        """Test creating an API key."""
        mock_verify.return_value = {
            "email": "testkey@example.com",
            "name": "Test Key User"
        }
        
        # Login
        login_response = client.post(
            "/api/auth/google",
            json={"credential": "mock_google_id_token"},
        )
        token = login_response.json()["access_token"]

        # Create API key
        response = client.post(
            "/api/auth/keys",
            json={"name": "My API Key", "rate_limit": 100},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["name"] == "My API Key"
        assert "key" in data  # Full key shown once

    @patch("app.services.auth_service.id_token.verify_oauth2_token")
    def test_list_api_keys(self, mock_verify, client):
        """Test listing API keys."""
        mock_verify.return_value = {
            "email": "testlistkey@example.com",
            "name": "Test List Key User"
        }
        
        # Login
        login_response = client.post(
            "/api/auth/google",
            json={"credential": "mock_google_id_token"},
        )
        token = login_response.json()["access_token"]

        client.post(
            "/api/auth/keys",
            json={"name": "My API Key"},
            headers={"Authorization": f"Bearer {token}"},
        )

        # List keys
        response = client.get(
            "/api/auth/keys",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1

    @patch("app.services.auth_service.id_token.verify_oauth2_token")
    def test_revoke_api_key(self, mock_verify, client):
        """Test revoking an API key."""
        mock_verify.return_value = {
            "email": "testrevokekey@example.com",
            "name": "Test Revoke Key User"
        }
        
        # Login
        login_response = client.post(
            "/api/auth/google",
            json={"credential": "mock_google_id_token"},
        )
        token = login_response.json()["access_token"]

        create_response = client.post(
            "/api/auth/keys",
            json={"name": "My API Key"},
            headers={"Authorization": f"Bearer {token}"},
        )
        key_id = create_response.json()["id"]

        # Revoke key
        response = client.delete(
            f"/api/auth/keys/{key_id}",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # List should show 0 active keys
        list_response = client.get(
            "/api/auth/keys",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert len(list_response.json()) == 0
