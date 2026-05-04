"""Tests for emotion dictionary API endpoints."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.user import User

# We just test the endpoint exists (200) — auth dependency will be resolved in Task 11
def test_emotion_dict_router_registered():
    """Verify router is registered (endpoint should at least return 401 or 200)."""
    # This test passes if importing doesn't crash and endpoint is reachable
    routes = [r.path for r in app.routes]
    assert "/api/users/me/emotion-dict" in routes, "emotion_dict router not registered"
