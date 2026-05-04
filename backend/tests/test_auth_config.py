"""Tests for auth configuration settings."""
from app.core.settings import Settings


def test_auth_cookie_secure_defaults_false_for_dev():
    assert Settings.model_fields["AUTH_COOKIE_SECURE"].default is False


def test_cookie_path_is_root():
    assert Settings.model_fields["AUTH_COOKIE_PATH"].default == "/"


def test_csrf_cookie_secure_defaults_false_for_dev():
    assert Settings.model_fields["CSRF_COOKIE_SECURE"].default is False


def test_refresh_cookie_name_is_set():
    assert Settings.model_fields["REFRESH_COOKIE_NAME"].default == "refresh_token"
