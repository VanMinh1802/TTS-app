"""Tests for rate limiting functionality."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock


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
