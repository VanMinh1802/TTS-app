"""Tests for app settings validation."""
import pytest
from app.core.settings import Settings, _validate_required


class TestJwtSecretKey:
    def test_rejects_empty(self):
        with pytest.raises(RuntimeError, match="JWT_SECRET_KEY must not be empty"):
            _validate_required(Settings(JWT_SECRET_KEY=""))

    def test_rejects_too_short(self):
        with pytest.raises(RuntimeError, match="at least 16 characters"):
            _validate_required(Settings(JWT_SECRET_KEY="short"))

    def test_accepts_valid_key(self):
        s = Settings(JWT_SECRET_KEY="this-is-a-real-secret-key-32chars-long!!")
        _validate_required(s)
        assert s.JWT_SECRET_KEY == "this-is-a-real-secret-key-32chars-long!!"
