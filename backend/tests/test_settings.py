import pytest
import warnings
from app.core.settings import Settings

def test_settings_warns_on_insecure_cookie_with_https_origin():
    """Test that a warning is raised when AUTH_COOKIE_SECURE is False but CORS_ORIGINS contains HTTPS."""
    with pytest.warns(UserWarning, match="CORS origins contain HTTPS URLs but AUTH_COOKIE_SECURE=False"):
        Settings(
            CORS_ORIGINS="https://example.com",
            AUTH_COOKIE_SECURE=False,
            JWT_SECRET_KEY="a" * 16, # Valid secret to pass validation if needed
            DATABASE_URL="postgresql://user:pass@localhost:5432/db"
        )

def test_settings_no_warning_on_secure_cookie_with_https_origin():
    """Test that no warning is raised when AUTH_COOKIE_SECURE is True and CORS_ORIGINS contains HTTPS."""
    with warnings.catch_warnings(record=True) as w:
        warnings.simplefilter("always")
        Settings(
            CORS_ORIGINS="https://example.com",
            AUTH_COOKIE_SECURE=True,
            JWT_SECRET_KEY="a" * 16,
            DATABASE_URL="postgresql://user:pass@localhost:5432/db"
        )
        assert not any("CORS origins contain HTTPS URLs but AUTH_COOKIE_SECURE=False" in str(warn.message) for warn in w)

def test_settings_no_warning_on_http_only_origins():
    """Test that no warning is raised when CORS_ORIGINS contains only HTTP."""
    with warnings.catch_warnings(record=True) as w:
        warnings.simplefilter("always")
        Settings(
            CORS_ORIGINS="http://localhost:3000",
            AUTH_COOKIE_SECURE=False,
            JWT_SECRET_KEY="a" * 16,
            DATABASE_URL="postgresql://user:pass@localhost:5432/db"
        )
        assert not any("CORS origins contain HTTPS URLs but AUTH_COOKIE_SECURE=False" in str(warn.message) for warn in w)
