import pytest
from unittest.mock import patch, MagicMock
from app.core import token_blacklist
from datetime import datetime, timedelta, timezone

def test_token_blacklist_db_fallback(db_session):
    """Test that token blacklist falls back to DB when Redis is down."""
    # Mock SessionLocal to return our test db_session
    # We also mock close() so it doesn't close the shared test session
    original_close = db_session.close
    db_session.close = MagicMock()
    
    try:
        with patch("app.core.token_blacklist.SessionLocal", return_value=db_session):
            with patch("app.core.token_blacklist.redis_sync_client", None):
                jti = "test-jti-db-fallback"
                
                # This should write to DB (RevokedToken table)
                token_blacklist.blacklist_access_token(jti, 3600)
                
                # This should read from DB
                assert token_blacklist.is_token_blacklisted(jti) is True
    finally:
        db_session.close = original_close

def test_token_blacklist_not_found(db_session):
    """Test that it returns False if not in Redis and not in DB."""
    original_close = db_session.close
    db_session.close = MagicMock()
    
    try:
        with patch("app.core.token_blacklist.SessionLocal", return_value=db_session):
            with patch("app.core.token_blacklist.redis_sync_client", None):
                assert token_blacklist.is_token_blacklisted("non-existent-jti") is False
    finally:
        db_session.close = original_close
