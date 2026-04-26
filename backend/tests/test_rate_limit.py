"""Tests for rate limiting functionality."""
import pytest
from unittest.mock import MagicMock, patch

from app.api.auth import get_current_user
from app.main import app
from app.services.rate_limiter import build_rate_limit_headers, rate_limit_dependency


class TestRateLimiter:
    """Test rate limiter service."""

    @pytest.mark.asyncio
    async def test_check_rate_limit_bypass_when_redis_unavailable(self):
        """Test that rate limiting is bypassed when Redis is unavailable."""
        from app.services.rate_limiter import check_rate_limit
        
        with patch('app.services.rate_limiter.get_redis', return_value=None):
            limit, remaining, reset_ts, is_limited = await check_rate_limit(
                "test_user", limit=10, window=60
            )
            
            assert limit == 10
            assert remaining == 10
            assert is_limited == False

    def test_get_user_identifier_from_api_key(self):
        """Test identifier extraction from API key header."""
        from fastapi import Request
        from app.services.rate_limiter import get_user_identifier
        
        mock_request = MagicMock(spec=Request)
        mock_request.headers.get = MagicMock(side_effect=lambda k, d=None: "test_api_key" if k == "X-API-Key" else None)
        mock_request.client = None
        mock_request.state = MagicMock()
        
        result = get_user_identifier(mock_request)
        
        assert result == "api_key:test_api_key"

    def test_get_user_identifier_no_auth(self):
        """Test identifier extraction when no auth present."""
        from fastapi import Request
        from app.services.rate_limiter import get_user_identifier
        
        mock_request = MagicMock(spec=Request)
        mock_request.headers.get = MagicMock(return_value=None)
        mock_request.client.host = "192.168.1.1"
        mock_request.state = MagicMock()
        mock_request.state.user = None
        
        result = get_user_identifier(mock_request)
        
        assert result == "ip:192.168.1.1"

    def test_tier_limits(self):
        """Test tier-based rate limits."""
        from app.services.rate_limiter import get_tier_limit, TIER_LIMITS
        
        free_limit, free_window = get_tier_limit("free")
        assert free_limit == TIER_LIMITS["free"]["requests"]
        assert free_window == TIER_LIMITS["free"]["window"]
        
        pro_limit, pro_window = get_tier_limit("pro")
        assert pro_limit == TIER_LIMITS["pro"]["requests"]
        
        default_limit, default_window = get_tier_limit("unknown_tier")
        assert default_limit == TIER_LIMITS["free"]["requests"]


class FakePipeline:
    def __init__(self, request_count: int):
        self.request_count = request_count

    def zremrangebyscore(self, *args, **kwargs):
        return self

    def zcard(self, *args, **kwargs):
        return self

    def zadd(self, *args, **kwargs):
        return self

    def expire(self, *args, **kwargs):
        return self

    async def execute(self):
        return [None, self.request_count, None, None]


class FakeRedis:
    def __init__(self, request_count: int):
        self.request_count = request_count

    def pipeline(self):
        return FakePipeline(self.request_count)


class TestProtectedRoutesRateLimiting:

    def test_rate_limit_edge_middleware_applies_before_route_dependency(self, client):
        from app.services import rate_limiter as rate_limiter_module
        from app.services.r2_service import r2_service

        class FakeUser:
            id = "user-1"
            subscription_tier = "free"

        app.dependency_overrides[get_current_user] = lambda: FakeUser()
        try:
            with patch.object(rate_limiter_module, "get_redis", return_value=FakeRedis(request_count=100)):
                with patch.object(
                    r2_service,
                    "generate_download_url",
                    return_value={
                        "url": "https://signed.example.com/download",
                        "expires_in": 3600,
                        "model_id": "piper-vi-en-medium",
                        "model_size": 123,
                    },
                ):
                    response = client.post("/api/models/piper-vi-en-medium/download-url")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 429
        assert response.headers["X-RateLimit-Limit"] == "100"
        assert response.headers["X-RateLimit-Remaining"] == "0"
        assert "Retry-After" in response.headers

    def test_protected_routes_use_authenticated_user_tier(self, client):
        from app.services import rate_limiter as rate_limiter_module
        from app.services.r2_service import r2_service

        class ProUser:
            id = "user-1"
            subscription_tier = "pro"

        app.dependency_overrides[get_current_user] = lambda: ProUser()

        try:
            with patch.object(rate_limiter_module, "get_redis", return_value=FakeRedis(request_count=101)):
                with patch.object(
                    r2_service,
                    "generate_download_url",
                    return_value={
                        "url": "https://signed.example.com/download",
                        "expires_in": 3600,
                        "model_id": "piper-vi-en-medium",
                        "model_size": 123,
                    },
                ):
                    response = client.post("/api/models/piper-vi-en-medium/download-url")
        finally:
            app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.headers["X-RateLimit-Limit"] == "10000"
        assert response.headers["X-RateLimit-Remaining"] == "9899"
        assert "X-RateLimit-Reset" in response.headers

    @pytest.mark.parametrize(
        "path,payload",
        [
            ("/api/models/piper-vi-en-medium/download-url", None),
            ("/api/audio/upload-url", {"filename": "output.wav", "content_type": "audio/wav"}),
        ],
    )
    def test_protected_routes_include_rate_limit_headers_on_success(self, client, path, payload):
        from app.services import rate_limiter as rate_limiter_module
        from app.services.r2_service import r2_service

        class FakeUser:
            id = "user-1"
            subscription_tier = "free"

        app.dependency_overrides[get_current_user] = lambda: FakeUser()

        with patch.object(rate_limiter_module, "get_redis", return_value=FakeRedis(request_count=1)):
            with patch.object(
                r2_service,
                "generate_download_url",
                return_value={
                    "url": "https://signed.example.com/download",
                    "expires_in": 3600,
                    "model_id": "piper-vi-en-medium",
                    "model_size": 123,
                },
            ), patch.object(
                r2_service,
                "generate_upload_url",
                return_value={
                    "upload_url": "https://signed.example.com/upload",
                    "expires_in": 3600,
                    "fields": {},
                    "user_id": "user-1",
                },
            ):
                response = client.post(
                    path,
                    json=payload,
                )

        app.dependency_overrides.clear()

        assert response.status_code == 200
        assert response.headers["X-RateLimit-Limit"] == "100"
        assert response.headers["X-RateLimit-Remaining"] == "99"
        assert "X-RateLimit-Reset" in response.headers

    def test_build_rate_limit_headers_returns_expected_shape(self):
        headers = build_rate_limit_headers(5, 2, 123)

        assert headers == {
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "2",
            "X-RateLimit-Reset": "123",
        }

    @pytest.mark.parametrize(
        "path,payload",
        [
            ("/api/models/piper-vi-en-medium/download-url", None),
            ("/api/audio/upload-url", {"filename": "output.wav", "content_type": "audio/wav"}),
        ],
    )
    def test_protected_routes_return_rate_limit_headers_when_limited(self, client, path, payload):
        from app.services import rate_limiter as rate_limiter_module

        class FakeUser:
            id = "user-1"
            subscription_tier = "free"

        app.dependency_overrides[get_current_user] = lambda: FakeUser()

        with patch.object(rate_limiter_module, "get_redis", return_value=FakeRedis(request_count=100)):
            response = client.post(
                path,
                json=payload,
            )

        app.dependency_overrides.clear()

        assert response.status_code == 429
        assert response.headers["X-RateLimit-Limit"] == "100"
        assert response.headers["X-RateLimit-Remaining"] == "0"
        assert "Retry-After" in response.headers
