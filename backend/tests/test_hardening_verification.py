import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_legacy_tts_endpoint_is_removed():
    """Verify /api/tts/generate is gone (404)."""
    response = client.post("/api/tts/generate", json={"text": "hello"})
    assert response.status_code == 404

def test_legacy_normalize_endpoint_is_removed():
    """Verify /api/normalize is gone (404)."""
    response = client.post("/api/normalize", json={"text": "hello"})
    assert response.status_code == 404

def test_protected_endpoint_requires_auth():
    """Verify that /api/auth/me requires authentication (401)."""
    response = client.get("/api/auth/me")
    assert response.status_code == 401

def test_logout_clears_cookies():
    """Verify that logout returns 200 even without token (clears session)."""
    response = client.post("/api/auth/logout")
    assert response.status_code == 200

def test_voices_api_still_works():
    """Verify that utility endpoints are still up."""
    response = client.get("/api/voices")
    assert response.status_code == 200
