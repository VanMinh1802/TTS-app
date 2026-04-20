"""Tests for analytics functionality."""
import pytest
from unittest.mock import MagicMock, patch
from datetime import date

from app.services.analytics_service import AnalyticsService


class TestAnalyticsService:
    """Test analytics service."""

    def test_log_request(self):
        """Test request logging."""
        mock_db = MagicMock()
        mock_add = MagicMock()
        mock_db.add = mock_add
        mock_db.commit = MagicMock()
        
        service = AnalyticsService(mock_db)
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
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.func.count.return_value = mock_query
        mock_query.scalar.return_value = 150
        
        service = AnalyticsService(mock_db)
        result = service.get_total_requests()
        
        assert result == 150

    def test_get_total_requests_zero(self):
        """Test getting total request count when none."""
        mock_db = MagicMock()
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.func.count.return_value = mock_query
        mock_query.scalar.return_value = None
        
        service = AnalyticsService(mock_db)
        result = service.get_total_requests()
        
        assert result == 0

    def test_update_usage_new(self):
        """Test creating new usage snapshot."""
        mock_db = MagicMock()
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = None
        
        service = AnalyticsService(mock_db)
        service.update_usage(user_id="user1", feature="tts", characters_used=100)
        
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()

    def test_update_usage_existing(self):
        """Test updating existing usage snapshot."""
        mock_snapshot = MagicMock()
        mock_snapshot.characters_used = 0
        mock_db = MagicMock()
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.first.return_value = mock_snapshot
        
        service = AnalyticsService(mock_db)
        service.update_usage(user_id="user1", feature="tts", characters_used=100)
        
        assert mock_snapshot.characters_used == 100
        mock_db.commit.assert_called_once()

    def test_get_average_latency(self):
        """Test getting average latency."""
        mock_db = MagicMock()
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.func.avg.return_value = mock_query
        mock_query.scalar.return_value = 145.5
        
        service = AnalyticsService(mock_db)
        result = service.get_average_latency()
        
        assert result == 145.5

    def test_get_requests_by_endpoint(self):
        """Test getting requests by endpoint."""
        mock_db = MagicMock()
        mock_results = [
            MagicMock(path="/api/auth/login", count=100),
            MagicMock(path="/api/tts/generate", count=50),
        ]
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.group_by.return_value = mock_query
        mock_query.order_by.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_query.all.return_value = mock_results
        
        service = AnalyticsService(mock_db)
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