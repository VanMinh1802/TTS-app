"""API scope mapping — determines required scope for each endpoint path."""
from typing import Optional


SCOPE_MAP: dict[str, str] = {
    "/api/tts": "tts:generate",
    "/api/models": "models:read",
    "/api/audio": "audio:upload",
    "/api/library": "library",
    "/api/dictionary": "dictionary",
    "/api/quota": "quota",
    "/api/voices": "voices:read",
    "/api/subscriptions": "subscriptions",
    "/api/admin": "admin",
    "/api/auth": "auth",
}


def get_required_scope(path: str) -> Optional[str]:
    """Return the scope string required for a given API path, or None if no specific scope."""
    for prefix, scope in SCOPE_MAP.items():
        if path.startswith(prefix):
            return scope
    return None


def has_scope(allowed_scopes: str, required_scope: Optional[str]) -> bool:
    """Check if a required scope is in the comma-separated allowed scopes string."""
    if required_scope is None:
        return True
    scopes = [s.strip() for s in allowed_scopes.split(",")]
    return required_scope in scopes or "*" in scopes
