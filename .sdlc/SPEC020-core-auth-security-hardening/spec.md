# Feature: Auth Security Hardening

> **Status:** Draft
> **Author:** Kilo
> **Date:** 2026-05-04
> **Related Issues:** Audit findings from backend auth review

---

## 1. Problem Statement

### 1.1 User Problem

The backend authentication system has 19 security and code quality issues identified through a comprehensive audit. Critical issues include no token revocation (logout is cosmetic), refresh token rotation without old token invalidation, missing CSRF enforcement, and `AUTH_COOKIE_SECURE=False` by default. These make the application vulnerable to token theft, CSRF attacks, and MITM cookie interception.

### 1.2 Business Impact

- **Security risk:** Stolen tokens remain valid up to 60 minutes (access) / 7 days (refresh)
- **Compliance:** No CSRF protection on state-changing endpoints violates OWASP Top 10
- **API abuse:** Login endpoint has no rate limiting, enabling brute-force and DoS
- **Maintainability:** Dead code, inconsistent patterns, and missing metrics hurt developer productivity

### 1.3 Success Criteria

- [ ] All 19 issues resolved
- [ ] CSRF double-submit cookie enforced on all mutating endpoints
- [ ] Token blacklist in Redis invalidates tokens on logout/refresh
- [ ] `AUTH_COOKIE_SECURE=True` in production, cookie path limited to `/api`
- [ ] Revoked API keys are immediately invalidated (Redis cache purged)
- [ ] Login endpoint rate-limited
- [ ] Google access token fallback validates audience
- [ ] All tests pass, no regression in existing auth flow
- [ ] Frontend unaffected (no API contract changes)

---

## 2. User Stories & Acceptance Criteria

### Story 1: Token Security Hardening (Group B)

**As a** security-conscious developer,
**I want** tokens to be properly invalidated on logout and refresh,
**so that** stolen tokens cannot be reused.

#### Acceptance Criteria

- **Given** a user logs out,
  **When** the access token is checked,
  **Then** it is rejected (found in Redis blacklist).

- **Given** a user refreshes their token,
  **When** the old refresh token is used again,
  **Then** it is rejected (old refresh token invalidated on rotation).

- **Given** an API key is revoked,
  **When** it is used again within 1 hour,
  **Then** it is rejected immediately (Redis cache entry purged).

### Story 2: CSRF Protection (Group C)

**As a** security auditor,
**I want** CSRF protection on all state-changing endpoints,
**so that** the application meets OWASP standards.

#### Acceptance Criteria

- **Given** a user logs in,
  **When** the response is sent,
  **Then** a `csrf_token` cookie is set (readable by JS, not HttpOnly).

- **Given** a state-changing request (POST/PUT/DELETE),
  **When** the `X-CSRF-Token` header is missing or mismatched,
  **Then** the request is rejected with 403.

- **Given** a GET request,
  **When** it is sent without CSRF token,
  **Then** it is allowed (read-only operations don't need CSRF).

### Story 3: Configuration & Cleanup (Groups A + D)

**As a** developer,
**I want** secure defaults and clean code,
**so that** the auth system is production-ready and maintainable.

#### Acceptance Criteria

- **Given** the app starts in production,
  **When** `AUTH_COOKIE_SECURE` is checked,
  **Then** it defaults to `True`.

- **Given** the access token cookie is set,
  **When** any static asset is requested,
  **Then** the cookie is NOT sent (path limited to `/api`).

- **Given** Google access token fallback is used,
  **When** the userinfo API returns a user,
  **Then** the token's audience is validated against the app's client ID.

- **Given** an admin endpoint is accessed,
  **When** `is_admin` is checked,
  **Then** the check is consistent across all files (single pattern).

---

## 3. Functional Requirements

### 3.1 Core Behaviors

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Implement token blacklist in Redis for access tokens on logout | Must |
| FR-2 | Invalidate previous refresh token on token rotation | Must |
| FR-3 | Purge Redis API key cache on key revocation | Must |
| FR-4 | Implement CSRF double-submit cookie + middleware enforcement | Must |
| FR-5 | Set `AUTH_COOKIE_SECURE` default to `True` | Must |
| FR-6 | Limit access token cookie path to `/api` | Must |
| FR-7 | Add CSRF cookie on login/refresh responses | Must |
| FR-8 | Add rate limiting to login endpoint | Must |
| FR-9 | Validate Google access token audience against `GOOGLE_CLIENT_ID` | Must |
| FR-10 | Enforce per-API-key `rate_limit` and `rate_limit_window` | Must |
| FR-11 | Delete dead `create_api_key()` from `app/core/security.py` | Should |
| FR-12 | Unify auth exception mapping (domain exceptions → correct HTTP status) | Should |
| FR-13 | Log Google JWT `ValueError` in token verification (don't silently swallow) | Should |
| FR-14 | Track Redis cache failure metrics for API key validation | Should |
| FR-15 | Use SHA256 hash of API key in Redis key, not plain key_id | Should |
| FR-16 | Add `__Host-` prefix to auth cookie names | Should |
| FR-17 | Fix `datetime.utcnow` → `datetime.now(timezone.utc)` in User model | Could |
| FR-18 | Unify admin check pattern (`current_user.is_admin` — direct access) | Could |
| FR-19 | Ensure logging middleware doesn't log response bodies containing API keys | Could |

### 3.2 Edge Cases

- Token blacklist key expires naturally with token TTL (no Redis cleanup needed)
- CSRF token regenerated on login/refresh, not on every request
- Rate limit on login: 10 attempts per IP per minute
- Redis unavailable → rate limiting fails open (existing behavior), CSRF still works (no Redis dependency)
- Multiple concurrent refreshes: first succeeds, subsequent ones with old token fail (replay detection)
- API key cache invalidation: delete by key pattern `apikey_auth:{key_id}:*`

### 3.3 Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| Login with blacklisted token | 401 "Token has been revoked" |
| Refresh with old token after rotation | 401 "Refresh token has been replaced" |
| Mutating request without CSRF token | 403 "CSRF token missing or invalid" |
| API key use after revocation | 401 "API key has been revoked" |
| Google token with wrong audience | 401 "Invalid Google credentials" |
| Login rate limit exceeded | 429 "Too many login attempts" |

---

## 4. Non-Functional Requirements

### 4.1 Performance

- Token blacklist lookup: O(1) Redis GET per authenticated request
- CSRF validation: O(1) string comparison per mutating request
- Redis cache purge: O(1) KEYS pattern match + DEL per revocation
- Login rate limit: O(1) Redis INCR per attempt

### 4.2 Security

- Token blacklist entries auto-expire with token TTL
- CSRF token: 32 bytes cryptographically random (`secrets.token_urlsafe`)
- CSRF cookie: SameSite=Strict, Secure=True, Path=/, HttpOnly=false (JS-readable for header)
- Auth cookie: `__Host-` prefix enforces Secure + Path=/ via browser
- No secrets in log output

### 4.3 Constraints

- Platform: FastAPI + Redis + SQLAlchemy (existing)
- Dependencies: No new packages; use existing `redis`, `python-jose`, `passlib`
- Must preserve existing API contracts (endpoint paths, response format)
- Must work with existing frontend (cookie-based auth)
- Must not break existing tests
- Implementation in worktree via subagent-driven-development

---

## 5. Unit Test Cases

| ID | File | Description | Status |
|----|------|-------------|--------|
| TC-01 | `tests/test_auth_config.py` | `AUTH_COOKIE_SECURE` defaults to True | RED |
| TC-02 | `tests/test_auth_config.py` | Access token cookie path is `/api` | RED |
| TC-03 | `tests/test_token_security.py` | Logout adds token to Redis blacklist | RED |
| TC-04 | `tests/test_token_security.py` | Blacklisted token returns 401 | RED |
| TC-05 | `tests/test_token_security.py` | Refresh rotates tokens + invalidates old | RED |
| TC-06 | `tests/test_token_security.py` | API key revoke clears Redis cache | RED |
| TC-07 | `tests/test_csrf_rate_limit.py` | CSRF token set on login | RED |
| TC-08 | `tests/test_csrf_rate_limit.py` | Mutating request without CSRF token → 403 | RED |
| TC-09 | `tests/test_csrf_rate_limit.py` | GET request without CSRF token → allowed | RED |
| TC-10 | `tests/test_csrf_rate_limit.py` | Login endpoint rate-limited | RED |
| TC-11 | `tests/test_auth_cleanup.py` | Google token with wrong audience rejected | RED |
| TC-12 | `tests/test_auth_cleanup.py` | `datetime` fields use timezone-aware UTC | RED |

---

## 6. Boundaries

### [ALLOW] Always Do

- Use existing Redis client for blacklist/cache/invalidation
- Use FastAPI middleware for CSRF enforcement
- Follow existing DI/UoW patterns for new auth logic
- Keep all endpoint paths and response formats unchanged
- Run `pytest` before each commit

### [CAUTION] Ask First

- Adding new Redis data structures (token blacklist)
- Modifying cookie names (frontend must match)
- Changing HTTP response codes for existing endpoints

### [FORBID] Never Do

- Store tokens or secrets in logs
- Force-push or skip hooks
- Break existing auth flow (Google OAuth, JWT, API key)
- Change the JWT signing algorithm or secret validation
- Skip CSRF enforcement on any mutating endpoint

---

## 7. Verification

### 7.1 Test Plan

| Requirement | Test Method | Status |
|-------------|-------------|--------|
| FR-1 (token blacklist) | Integration test with Redis mock | Pending |
| FR-2 (refresh rotation) | Integration test | Pending |
| FR-3 (API key cache purge) | Unit test | Pending |
| FR-4 (CSRF enforcement) | Integration test | Pending |
| FR-5 (cookie secure default) | Unit test | Pending |
| FR-6 (cookie path) | Unit test | Pending |
| FR-7 (CSRF cookie set) | Integration test | Pending |
| FR-8 (login rate limit) | Integration test | Pending |
| FR-9 (Google audience check) | Unit test | Pending |
| FR-10 (per-key rate limit) | Unit test | Pending |
| FR-11..19 (cleanup) | Unit tests | Pending |

### 7.2 Acceptance Checklist

- [ ] All 19 issues resolved
- [ ] All 12 new test cases pass
- [ ] All 95 existing tests still pass
- [ ] CSRF token set on login response
- [ ] Token blacklist works with Redis
- [ ] API key cache invalidated on revoke
- [ ] `AUTH_COOKIE_SECURE = True`
- [ ] Cookie path limited to `/api`
- [ ] Login endpoint rate-limited
- [ ] Google audience validated
- [ ] Dead code removed
- [ ] Exception mapping unified
- [ ] No frontend breakage

---

## 8. Out of Scope

- Password-based authentication (only Google OAuth + API keys)
- Two-factor authentication
- Session management UI
- OAuth provider beyond Google
- IP-based rate limiting
- JWT algorithm change (staying with HS256)

---

## 9. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-05-04 | v1.0 | Kilo | Initial spec from auth audit findings | — | All |
