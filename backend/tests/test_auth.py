"""Tests for authentication endpoints."""
import pytest
from fastapi import status


class TestAuth:
    """Authentication endpoint tests."""

    def test_register_success(self, client):
        """Test user registration."""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "password": "password123",
                "name": "Test User",
            },
        )
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["name"] == "Test User"
        assert "id" in data

    def test_register_duplicate_email(self, client):
        """Test duplicate email registration."""
        # Register first user
        client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "password": "password123",
            },
        )

        # Try to register again
        response = client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "password": "password123",
            },
        )
        assert response.status_code == status.HTTP_409_CONFLICT

    def test_login_success(self, client):
        """Test successful login."""
        # Register user first
        client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "password": "password123",
            },
        )

        # Login
        response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "password123",
            },
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials."""
        response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "wrongpassword",
            },
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_me_unauthorized(self, client):
        """Test getting current user without auth."""
        response = client.get("/api/auth/me")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_me_success(self, client):
        """Test getting current user with auth."""
        # Register and login
        client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "password": "password123",
                "name": "Test User",
            },
        )
        login_response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "password123",
            },
        )
        token = login_response.json()["access_token"]

        # Get current user
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["name"] == "Test User"


class TestAPIKeys:
    """API Key endpoint tests."""

    def test_create_api_key(self, client):
        """Test creating an API key."""
        # Register and login
        client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "password": "password123",
            },
        )
        login_response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "password123",
            },
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

    def test_list_api_keys(self, client):
        """Test listing API keys."""
        # Register, login, create key
        client.post(
            "/api/auth/register",
            json={"email": "test@example.com", "password": "password123"},
        )
        login_response = client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "password123"},
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

    def test_revoke_api_key(self, client):
        """Test revoking an API key."""
        # Register, login, create key
        client.post(
            "/api/auth/register",
            json={"email": "test@example.com", "password": "password123"},
        )
        login_response = client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "password123"},
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
