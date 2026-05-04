# Auth Security Hardening — Implementation Plan

**Goal:** Fix all 19 security vulnerabilities and code quality issues found in the backend auth audit.

**Architecture:** Add Redis-based token blacklist, CSRF double-submit cookie middleware, and per-key rate limit enforcement. No structural changes to auth flow.

**Tech Stack:** FastAPI + Redis + SQLAlchemy 2.0 (no new packages)

---

> **Spec:** [spec.md](./spec.md)
> **Status:** Draft
> **Author:** Kilo
> **Date:** 2026-05-04

---

## 1. Architecture Overview

### 1.1 Before vs After

```
BEFORE:                          AFTER:
┌──────────┐                    ┌──────────┐
│  Login   │ → JWT              │  Login   │ → JWT + CSRF cookie
│  Refresh │ → new tokens       │  Refresh │ → new tokens + invalidate old
│  Logout  │ → clear cookies    │  Logout  │ → blacklist token + clear cookies
│  Revoke  │ → DB update        │  Revoke  │ → DB update + purge Redis cache
│  Request │ → no CSRF check    │  Request │ → CSRF middleware (mutating only)
└──────────┘                    └──────────┘
```

### 1.2 New Components

```
app/
  core/
    csrf.py           # NEW: create_csrf_token(), validate_csrf_token()
    token_blacklist.py # NEW: blacklist_token(), is_blacklisted()
  middleware/
    csrf.py            # NEW: CSRFMiddleware (FastAPI BaseHTTPMiddleware)
```

### 1.3 Redis Key Schema

| Key Pattern | Purpose | TTL |
|-------------|---------|-----|
| `token_bl:{jti}` | Token blacklist entry | 60 min |
| `refresh_bl:{jti}` | Refresh token invalidation | 7 days |
| `csrf:{token}` | CSRF token validation | 24 hours |
| `apikey_auth:{key_id}:*` | API key bcrypt cache (existing) | Purged on revoke |
| `login_rate:{ip}` | Login rate limit counter | 60 sec |

---

## 2. Tech Stack & Dependencies

| Category | Choice | Rationale |
|----------|--------|-----------|
| Framework | FastAPI (existing) | Built-in middleware, Depends |
| Cache | Redis (existing) | Blacklist, rate limit, CSRF validation |
| Auth | python-jose + passlib (existing) | JWT + bcrypt |
| RNG | secrets (stdlib) | CSRF token generation |

### 2.1 New Dependencies

**None.** All changes use existing packages.

---

## 3. Implementation Tasks

---

### Task A: Configuration Fixes (FR-5, FR-6, FR-7, FR-16, FR-18)

**Files:** `app/core/settings.py`, `app/api/auth.py`, `app/core/security.py`, `app/api/analytics.py`, `app/api/license.py`

#### A1. Fix AUTH_COOKIE_SECURE default
In `app/core/settings.py`:
```python
AUTH_COOKIE_SECURE: bool = True
```

#### A2. Limit cookie path to `/api`
In `app/api/auth.py`, change cookie path from `"/"` to `"/api"`:
```python
# _set_auth_cookie
path="/api",
max_age=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,

# _set_refresh_cookie
path="/api/auth",
max_age=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 86400,
```

#### A3. Add CSRF cookie on login + refresh
In `app/api/auth.py`, `login_google()` and `refresh_token()`, after setting auth cookies:
```python
from app.core.security import create_csrf_token

csrf_token = create_csrf_token()
response.set_cookie(
    key=settings.CSRF_COOKIE_NAME,
    value=csrf_token,
    httponly=False,  # JS must read it for X-CSRF-Token header
    secure=settings.CSRF_COOKIE_SECURE,
    samesite=settings.CSRF_COOKIE_SAMESITE,
    path="/",
    max_age=settings.CSRF_COOKIE_MAX_AGE,
)
```

#### A4. Add `__Host-` prefix to cookie names
Change cookie names from `access_token` / `refresh_token` to `__Host-access_token` / `__Host-refresh_token`. Update all cookie reads in both backend and frontend.

In `app/core/settings.py`:
```python
AUTH_COOKIE_NAME: str = "__Host-access_token"
REFRESH_COOKIE_NAME: str = "__Host-refresh_token"
```

#### A5. Unify admin check to `current_user.is_admin`
Replace `getattr(current_user, "is_admin", False)` in `analytics.py:15` with `current_user.is_admin`.

#### Tests: `tests/test_auth_config.py`
```python
def test_auth_cookie_secure_defaults_true():
    s = Settings()
    assert s.AUTH_COOKIE_SECURE is True

def test_cookie_path_is_api():
    s = Settings()
    assert s.AUTH_COOKIE_PATH == "/api"

def test_csrf_cookie_set_on_login(client, monkeypatch):
    # Mock Google token verification
    # Verify csrf_token cookie in response
```

---

### Task B: Token Security (FR-1, FR-2, FR-3, FR-10, FR-15)

**Files:** `app/core/token_blacklist.py` (NEW), `app/core/security.py`, `app/api/auth.py`, `app/services/auth_service.py`

#### B1. Create token blacklist module
`app/core/token_blacklist.py`:
```python
"""Token blacklist using Redis for logout and refresh rotation."""
from app.core.redis import redis_sync_client, redis_client


def blacklist_access_token(jti: str, ttl: int = 3600) -> None:
    """Blacklist an access token by its JWT ID."""
    if redis_sync_client:
        redis_sync_client.setex(f"token_bl:{jti}", ttl, "1")


async def blacklist_refresh_token(jti: str, ttl: int = 604800) -> None:
    """Blacklist a refresh token by its JWT ID."""
    if redis_client:
        await redis_client.setex(f"refresh_bl:{jti}", ttl, "1")


def is_token_blacklisted(jti: str) -> bool:
    """Check if a token's JTI is blacklisted."""
    if not redis_sync_client:
        return False
    return redis_sync_client.exists(f"token_bl:{jti}") == 1


def is_refresh_token_blacklisted(jti: str) -> bool:
    """Check if a refresh token's JTI is blacklisted."""
    if not redis_sync_client:
        return False
    return redis_sync_client.exists(f"refresh_bl:{jti}") == 1
```

#### B2. Add JTI to JWT tokens
In `app/core/security.py`, add `jti` (JWT ID) to access and refresh tokens:
```python
def create_access_token(data: dict, expires_delta=None) -> str:
    to_encode = data.copy()
    to_encode["jti"] = secrets.token_hex(16)  # ADD
    # ... rest unchanged

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode["jti"] = secrets.token_hex(16)  # ADD
    # ... rest unchanged
```

#### B3. Check blacklist in `get_current_user()`
In `app/services/auth_service.py`, `get_current_user()`:
```python
from app.core.token_blacklist import is_token_blacklisted

jti = payload.get("jti")
if jti and is_token_blacklisted(jti):
    raise PermissionDeniedError("Token has been revoked")
```

#### B4. Blacklist on logout
In `app/api/auth.py`, `logout()`:
```python
from app.core.token_blacklist import blacklist_access_token, blacklist_refresh_token

token = request.cookies.get(settings.AUTH_COOKIE_NAME)
if token:
    payload = decode_token(token)
    if payload and payload.get("jti"):
        blacklist_access_token(payload["jti"])
# Same for refresh token
refresh = request.cookies.get(REFRESH_COOKIE_NAME)
if refresh:
    payload = decode_token(refresh)
    if payload and payload.get("jti"):
        blacklist_refresh_token(payload["jti"])
_clear_auth_cookies(response)
```

#### B5. Invalidate old refresh token on rotation
In `app/api/auth.py`, `refresh_token()`, before issuing new tokens:
```python
old_jti = payload.get("jti")
if old_jti:
    from app.core.token_blacklist import blacklist_refresh_token
    blacklist_refresh_token(old_jti)
```

#### B6. Purge API key Redis cache on revoke
In `app/services/auth_service.py`, `revoke_api_key()`:
```python
def revoke_api_key(self, user: User, key_id: str) -> bool:
    api_key = self.uow.api_keys.get_active_key(key_id)
    if not api_key:
        raise NotFoundError("API key not found")
    api_key.is_active = False
    self.uow.commit()
    
    # Purge Redis cache entries
    if redis_sync_client:
        keys = redis_sync_client.keys(f"apikey_auth:{key_id}:*")
        if keys:
            redis_sync_client.delete(*keys)
    return True
```

#### Tests: `tests/test_token_security.py`
```python
def test_blacklisted_token_returns_401(client, monkeypatch):
    # Login → get token → logout → use same token → 401

def test_refresh_rotation_invalidates_old_token(client, monkeypatch):
    # Login → refresh (get new tokens) → try old refresh token → 401

def test_api_key_revoke_purges_cache(db_session, monkeypatch):
    # Create key → validate (cache hit) → revoke → validate (cache miss + DB check fail)
```

---

### Task C: CSRF + Rate Limit (FR-4, FR-7, FR-8, FR-14)

**Files:** `app/core/csrf.py` (NEW), `app/middleware/csrf.py` (NEW), `app/main.py`, `app/api/auth.py`, `app/services/rate_limiter.py`

#### C1. Create CSRF module
`app/core/csrf.py`:
```python
"""CSRF protection using double-submit cookie pattern."""
import secrets
from fastapi import Request, HTTPException, status
from app.core.settings import settings


def generate_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def validate_csrf(request: Request) -> None:
    """Validate CSRF double-submit cookie against header."""
    cookie_token = request.cookies.get(settings.CSRF_COOKIE_NAME)
    header_token = request.headers.get(settings.CSRF_HEADER_NAME)
    if not cookie_token or not header_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token missing",
        )
    if not secrets.compare_digest(cookie_token, header_token):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token mismatch",
        )
```

#### C2. Create CSRF middleware
`app/middleware/csrf.py`:
```python
"""CSRF enforcement middleware for mutating HTTP methods."""
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, Response
from app.core.csrf import validate_csrf

SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}

class CSRFMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method.upper() not in SAFE_METHODS:
            validate_csrf(request)
        return await call_next(request)
```

#### C3. Register middleware in main.py
```python
from app.middleware.csrf import CSRFMiddleware
app.add_middleware(CSRFMiddleware)
```

#### C4. Add rate limit to login endpoint
In `app/api/auth.py`, `login_google()`:
```python
from app.services.rate_limiter import RateLimiter

# Inside handler:
limiter = RateLimiter()
if not limiter.check_login_rate(request.client.host):
    raise HTTPException(status_code=429, detail="Too many login attempts")
```

Add to `rate_limiter.py`:
```python
def check_login_rate(self, ip: str) -> bool:
    key = f"login_rate:{ip}"
    count = redis_client.incr(key)
    if count == 1:
        redis_client.expire(key, 60)
    return count <= 10  # 10 attempts per minute
```

#### C5. Track Redis cache metrics
In `app/services/auth_service.py`, increment counters on cache hit/miss:
```python
# After Redis read:
if cached_result == "1":
    cache_hits += 1  # Track via Redis INCR apikey_cache:hits
elif cached_result == "0":
    cache_misses += 1
```

#### Tests: `tests/test_csrf_rate_limit.py`
```python
def test_mutating_request_without_csrf_returns_403(client):
    response = client.post("/api/library/upload", ...)
    assert response.status_code == 403

def test_get_request_without_csrf_allowed(client):
    response = client.get("/api/voices")
    assert response.status_code == 200

def test_login_rate_limit_returns_429_after_10_attempts(client, monkeypatch):
    # Mock Redis, loop 11 login attempts, assert 429
```

---

### Task D: Cleanup (FR-9, FR-11, FR-12, FR-13, FR-17, FR-19)

**Files:** `app/core/security.py`, `app/services/auth_service.py`, `app/models/user.py`, `app/middleware/logging.py`

#### D1. Delete dead `create_api_key()` from security.py
Remove lines 64-76 from `app/core/security.py` (the old `gva_{hex}` format). Keep only the one in `auth_service.py`.

#### D2. Validate Google access token audience
In `app/services/auth_service.py`, after calling userinfo API:
```python
# Verify the access token belongs to this app
token_info_response = await client.get(
    "https://www.googleapis.com/oauth2/v3/tokeninfo",
    params={"access_token": credential},
    timeout=10.0,
)
if token_info_response.status_code == 200:
    token_info = token_info_response.json()
    if token_info.get("audience") != settings.GOOGLE_CLIENT_ID:
        raise PermissionDeniedError("Google token not issued for this application")
```

#### D3. Log Google JWT ValueError
In `app/services/auth_service.py:48`, change:
```python
except ValueError:
    pass
```
to:
```python
except ValueError as e:
    logger.debug("Google ID token verification failed: %s", e)
```

#### D4. Fix datetime to timezone-aware
In `app/models/user.py`:
```python
from datetime import datetime, timezone

created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
updated_at: Mapped[datetime] = mapped_column(
    DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
)
```

Same fix in all other models (`license.py`, `audio_record.py`, etc.).

#### D5. Fix exception mapping
In `app/api/auth.py`, `get_current_user()`, distinguish error types:
```python
except NotFoundError:
    raise HTTPException(status_code=404, ...)
except PermissionDeniedError:
    raise HTTPException(status_code=403, ...)
except ServiceError:
    raise HTTPException(status_code=401, ...)  # Default for auth
```

Or add a dedicated `AuthenticationError` to `app/core/exceptions.py`:
```python
class AuthenticationError(ServiceError):
    """Raised for authentication failures (maps to 401)."""
    pass
```

#### D6. Ensure middleware doesn't log API key responses
In `app/middleware/logging.py`, skip logging for response bodies or filter out `key` field.

The logging middleware only logs request metadata (method, path, status), not response bodies — no change needed. Verified by reading `logging.py` (lines 33-42 log only request metadata).

#### Tests: `tests/test_auth_cleanup.py`
```python
def test_google_token_wrong_audience_rejected(monkeypatch):
    # Mock userinfo to return user, mock tokeninfo to return wrong audience
    # Verify PermissionDeniedError raised

def test_datetime_fields_are_timezone_aware(db_session):
    user = User(email="test@test.com")
    db_session.add(user)
    db_session.commit()
    assert user.created_at.tzinfo is not None
```

---

### Task E: Frontend Cookie Name Sync

**Files:** `frontend/src/lib/api-client.ts`, `frontend/src/proxy.ts`

After renaming cookies to `__Host-access_token` / `__Host-refresh_token`:
- `proxy.ts`: Update cookie name in middleware route protection
- `api-client.ts`: Update any cookie references
- `Navbar.tsx`: No change needed (reads from localStorage, not cookies)

---

## 4. Verification

Run after each task:
```powershell
$env:PYTHONPATH="."; pytest tests/test_auth_config.py tests/test_token_security.py tests/test_csrf_rate_limit.py tests/test_auth_cleanup.py -v --tb=short
$env:PYTHONPATH="."; pytest tests/ -v --tb=short 2>&1 | Select-Object -Last 5
```

---

## 5. Constraints & Trade-offs

| Decision | Alternative | Why this choice |
|----------|-------------|-----------------|
| Redis for token blacklist | DB table | O(1) lookup, auto-TTL expiry, no cleanup |
| Double-submit cookie CSRF | Synchronizer token pattern | Simpler, no server-side CSRF state |
| `__Host-` cookie prefix | Regular names | Browser-enforced Secure + Path |
| JTI in JWT for revocation | Token version field on User | Stateless, no DB query per request |
| Rate limit fail-open on Redis down | Fail-closed | Better UX, DoS resilience is handled at infra level |

### Out of Scope (Technical)
- JWT algorithm change (HS256 → RS256)
- Refresh token family tracking (already covers basic rotation)
- Rate limit per endpoint beyond login
- CSRF exemption list beyond SAFE_METHODS
- Cookie `Domain` attribute (not needed for single-domain app)

---

## 6. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-05-04 | v1.0 | Kilo | Initial plan from auth audit | — | All |
