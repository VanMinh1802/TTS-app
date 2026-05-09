"""Tests for Quota API."""
import pytest
from unittest.mock import MagicMock
from fastapi import status
from fastapi.testclient import TestClient

from app.api.quota import get_quota_service
from app.main import app
from app.schemas.quota import QuotaStatusResponse
from app.services.quota_service import QuotaService


class TestQuotaStatus:

    def test_get_quota(self, client):
        """Test getting quota."""
        response = client.get("/api/quota")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "tier" in data

    def test_quota_status_response_accepts_nullable_limits(self):
        """Test quota schema accepts unlimited limits."""
        response = QuotaStatusResponse(
            tier="enterprise",
            limits={
                "characters_per_month": None,
                "storage_mb": None,
                "api_calls_per_day": None,
            },
            usage={
                "characters_this_month": 0,
                "storage_used_mb": 0,
                "api_calls_today": 0,
            },
            remaining={"characters": None, "storage_mb": None, "api_calls": None},
            reset_at=None,
        )

        assert response.model_dump()["limits"]["characters_per_month"] is None
        assert response.model_dump()["limits"]["storage_mb"] is None
        assert response.model_dump()["remaining"]["api_calls"] is None


class TestQuotaUsage:

    def test_get_usage_history(self, client):
        """Test getting usage history."""
        response = client.get("/api/quota/usage")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "history" in data
        assert isinstance(data["history"], list)

    def test_quota_service_allows_unlimited_limits(self):
        """Test quota checks work for unlimited tiers."""
        from unittest.mock import MagicMock

        quota = MagicMock(
            characters_used=123,
            characters_limit=None,
            storage_used_mb=25,
            storage_limit_mb=None,
            api_calls_today=7,
            api_calls_limit=None,
            tier="enterprise",
            last_reset_at=None,
        )
        service = QuotaService(MagicMock())
        service.get_or_create_quota = MagicMock(return_value=quota)

        assert service.check_quota("user-1", "characters", 100000) is True
        assert service.check_quota("user-1", "storage", 100000) is True
        assert service.check_quota("user-1", "api_calls", 100000) is True

        status = service.get_quota_status("user-1")
        remaining = status["remaining"]
        assert remaining["characters"] is None
        assert remaining["storage_mb"] is None
        assert remaining["api_calls"] is None


class TestQuotaReset:

    def test_reset_quota(self, client):
        """Test resetting quota."""
        response = client.post("/api/quota/reset")
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["status"] == "success"