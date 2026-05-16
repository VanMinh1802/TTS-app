"""Tests for analytics functionality."""
import pytest
from unittest.mock import MagicMock, patch
from datetime import date

from app.core.uow import UnitOfWork
from app.db import get_db
from app.middleware.logging import LoggingMiddleware
from app.models.analytics import RequestLog
from app.services.analytics_service import AnalyticsService


class TestAnalyticsService:
    """Test analytics service."""

    def test_log_request(self):
        """Test request logging."""
        mock_db = MagicMock()
        mock_add = MagicMock()
        mock_db.add = mock_add
        mock_db.commit = MagicMock()

        uow = UnitOfWork(mock_db)
        service = AnalyticsService(uow)
        result = service.log_request(
            method="POST",
            path="/api/v1/tts/generate",
            status_code=200,
            latency_ms=150,
            user_id=1,
            ip_address="192.168.1.1",
            user_agent="Mozilla/5.0",
        )

        mock_add.assert_called_once()
        mock_db.commit.assert_called_once()
        assert result.method == "POST"
        assert result.status_code == 200

    def test_get_total_requests(self):
        """Test getting total request count."""
        mock_db = MagicMock()
        mock_db.execute.return_value.scalar.return_value = 150

        uow = UnitOfWork(mock_db)
        service = AnalyticsService(uow)
        result = service.get_total_requests()

        assert result == 150

    def test_get_total_requests_zero(self):
        """Test getting total request count when none."""
        mock_db = MagicMock()
        mock_db.execute.return_value.scalar.return_value = None

        uow = UnitOfWork(mock_db)
        service = AnalyticsService(uow)
        result = service.get_total_requests()

        assert result == 0

    def test_update_usage_new(self):
        """Test creating new usage snapshot."""
        mock_db = MagicMock()
        mock_db.execute.return_value.scalar_one_or_none.return_value = None
        mock_db.add = MagicMock()
        mock_db.flush = MagicMock()
        mock_db.commit = MagicMock()

        uow = UnitOfWork(mock_db)
        service = AnalyticsService(uow)
        service.update_usage(user_id="user1", feature="tts", characters_used=100)

        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()

    def test_update_usage_existing(self):
        """Test updating existing usage snapshot."""
        mock_snapshot = MagicMock()
        mock_snapshot.characters_used = 0
        mock_db = MagicMock()
        mock_db.execute.return_value.scalar_one_or_none.return_value = mock_snapshot
        mock_db.commit = MagicMock()

        uow = UnitOfWork(mock_db)
        service = AnalyticsService(uow)
        service.update_usage(user_id="user1", feature="tts", characters_used=100)

        assert mock_snapshot.characters_used == 100
        mock_db.commit.assert_called_once()

    def test_get_average_latency(self):
        """Test getting average latency."""
        mock_db = MagicMock()
        mock_db.execute.return_value.scalar.return_value = 145.5

        uow = UnitOfWork(mock_db)
        service = AnalyticsService(uow)
        result = service.get_average_latency()

        assert result == 145.5

    def test_get_requests_by_endpoint(self):
        """Test getting requests by endpoint."""
        mock_db = MagicMock()
        mock_results = [
            MagicMock(path="/api/auth/login", count=100),
            MagicMock(path="/api/tts/generate", count=50),
        ]
        mock_db.execute.return_value.all.return_value = mock_results

        uow = UnitOfWork(mock_db)
        service = AnalyticsService(uow)
        result = service.get_requests_by_endpoint()

        assert len(result) == 2
        assert result[0]["path"] == "/api/auth/login"
        assert result[0]["count"] == 100


class TestAnalyticsAPI:
    """Test analytics API endpoints."""

    def test_require_admin_non_admin(self):
        """Test require_admin raises error for non-admin."""
        from app.api.analytics import require_admin
        from fastapi import HTTPException

        mock_user = MagicMock()
        mock_user.is_admin = False

        with pytest.raises(HTTPException) as exc_info:
            require_admin(mock_user)

        assert exc_info.value.status_code == 403

    def test_require_admin_admin_user(self):
        """Test require_admin passes for admin."""
        from app.api.analytics import require_admin

        mock_user = MagicMock()
        mock_user.is_admin = True

        result = require_admin(mock_user)

        assert result == mock_user


class TestLoggingMiddleware:
    """Test request logging middleware."""

    @pytest.mark.asyncio
    async def test_dispatch_persists_request_log(self, client, db_session):
        """Test middleware inserts a request log row."""
        from app.main import app
        from app.api.auth import get_current_user
        from app.middleware import logging as logging_middleware

        app.dependency_overrides[get_current_user] = lambda: MagicMock(id="user-1")

        def override_get_db():
            try:
                yield db_session
            finally:
                pass

        original_get_db = logging_middleware.get_db
        logging_middleware.get_db = override_get_db

        try:
            response = client.get(
                "/api/quota",
                headers={"User-Agent": "pytest-agent", "X-Forwarded-For": "203.0.113.10, 198.51.100.1"},
            )
            assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()
            logging_middleware.get_db = original_get_db

        logs = db_session.query(RequestLog).all()
        assert len(logs) == 1
        assert logs[0].path == "/api/quota"
        assert logs[0].user_agent == "pytest-agent"
        assert logs[0].ip_address == "203.0.113.10"

    def test_normalize_request_metadata_shared_helper(self):
        """Test metadata normalization is shared and consistent."""
        from app.services.analytics_service import normalize_request_metadata

        class DummyState:
            pass

        request = MagicMock()
        request.state = DummyState()
        request.state.user = MagicMock()
        request.state.user.__dict__["id"] = "user-2"
        
        request.client = MagicMock(host="10.0.0.2")
        request.headers = {"X-Forwarded-For": "198.51.100.4, 10.0.0.2", "User-Agent": "abc"}
        request.method = "POST"
        request.url.path = "/api/test"

        metadata = normalize_request_metadata(request)

        assert metadata["user_id"] == "user-2"
        assert metadata["ip_address"] == "198.51.100.4"
        assert metadata["user_agent"] == "abc"
