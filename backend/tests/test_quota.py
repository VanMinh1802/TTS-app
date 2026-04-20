"""Tests for Quota API."""
import pytest
from fastapi import status
from fastapi.testclient import TestClient


class TestQuotaStatus:

    def test_get_quota_unauthorized(self, client):
        """Test getting quota without auth."""
        response = client.get("/api/quota")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_quota_with_auth(self, client):
        """Test getting quota with auth."""
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

        response = client.get(
            "/api/quota",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["tier"] == "free"
        assert "limits" in data
        assert "usage" in data
        assert "remaining" in data


class TestQuotaUsage:

    def test_get_usage_history_unauthorized(self, client):
        """Test getting usage history without auth."""
        response = client.get("/api/quota/usage")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_usage_history_with_auth(self, client):
        """Test getting usage history with auth."""
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

        response = client.get(
            "/api/quota/usage",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "history" in data
        assert isinstance(data["history"], list)


class TestQuotaReset:

    def test_reset_quota_with_auth(self, client):
        """Test resetting quota."""
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

        response = client.post(
            "/api/quota/reset",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["status"] == "success"