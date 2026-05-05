# Feature: License Key & API Key Security Hardening

> **Status:** Draft
> **Author:** Kilo
> **Date:** 2026-05-05
> **Related Issues:** Security audit of key management

---

## 1. Problem Statement

### 1.1 User Problem

The current license key and API key mechanisms have critical security gaps: license codes are stored as plaintext in DB, have only 41-bit entropy (brute-forceable), and the activation endpoint has no rate limiting. API key scopes are defined but never enforced. There is no audit trail for key usage or activation attempts.

### 1.2 Business Impact

- **Brute-force risk:** License code entropy of 8 chars (36^8 ≈ 2.8 trillion) is brute-forceable at ~5K req/s under 7 days
- **Data breach risk:** License codes stored as plaintext — DB compromise exposes all unused licenses
- **Abuse vector:** No rate limit on activation endpoint enables unlimited brute-force attempts
- **API key misuse:** Scopes like `"models:read,tts:generate"` are stored but never validated — any key can access any endpoint
- **No audit trail:** Impossible to detect abnormal key usage patterns or suspicious activation attempts
- **Per-key rate limits ignored:** APIKey model has `rate_limit` field but the rate limiter always uses user tier

### 1.3 Success Criteria

- [ ] License code entropy increased from 41-bit to 128-bit
- [ ] License code stored as bcrypt hash (never in plaintext after creation)
- [ ] Activation endpoint rate-limited to 5 attempts per IP per minute
- [ ] API key scopes enforced at validation time
- [ ] Activation attempts logged (success + failure) for audit
- [ ] Per-API-key rate limits enforced
- [ ] Unused license keys auto-expire after 90 days
- [ ] All existing tests pass, no API contract changes

---

## 2. Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Increase license code entropy: `secrets.token_urlsafe(16)` → 128-bit (128 chars), store truncated display version | Must |
| FR-2 | Hash license code with bcrypt before storing; return full code once at creation, never again | Must |
| FR-3 | Rate limit `/api/subscriptions/activate`: 5 attempts per IP per minute via Redis | Must |
| FR-4 | Log all activation attempts to `activation_logs` table (user_id, code_hash, success, ip, timestamp) | Must |
| FR-5 | Enforce API key `scopes` string at validation: parse scope list, check against requested endpoint | Must |
| FR-6 | Enforce per-API-key `rate_limit` and `rate_limit_window` in rate limiter | Must |
| FR-7 | Fix `datetime.utcnow()` → `datetime.now(timezone.utc)` in `license_service.py` | Should |
| FR-8 | Auto-expire unused license keys after 90 days: scheduled check or lazy expiration on list | Should |

---

## 3. Design

### 3.1 License Key Generation (FR-1, FR-2)

**Before:**
```python
random_part = secrets.token_urlsafe(6).upper().replace("-","").replace("_","")[:8]
code = f"{tier.upper()}-{duration_days}-{random_part}"
# Stored as plaintext in DB
```

**After:**
```python
random_part = secrets.token_urlsafe(16)  # 128-bit entropy
code = f"{tier.upper()}-{duration_days}-{random_part}"
code_hash = pwd_context.hash(code)
# Store: code_hash, code_display (first 4 + last 4 chars)
# Return full code once in API response only
```

**DB changes:** Add `code_hash` column (String(255)), rename/keep `code` as `code_display` or add both. Migration: `ALTER TABLE license_keys ADD COLUMN code_hash VARCHAR(255)`.

### 3.2 License Activation (FR-3, FR-4)

**Before:**
```python
def activate_key(self, current_user, code):
    key = self.uow.licenses.get_by_code(code)
    # No rate limit, no logging
```

**After:**
```python
def activate_key(self, current_user, code, request: Request):
    # Rate limit check
    if not check_activation_rate_limit(request):
        raise HTTPException(429, "Too many activation attempts")
    
    # Find by iterating recent keys (partial match) or lookup by display code
    # Verify bcrypt hash against stored code_hash
    key = find_license_by_code_hash(code)
    if not key:
        log_activation_attempt(user_id, code, False, request)
        raise NotFoundError("License code not found")
    
    key.is_used = True
    log_activation_attempt(user_id, key.code_hash, True, request)
```

**Activation logs table:**
```sql
CREATE TABLE activation_logs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    code_hash VARCHAR(255),
    success BOOLEAN,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE
);
```

### 3.3 API Key Scope Enforcement (FR-5)

**Current:** `scopes` field stores string like `"models:read,tts:generate"` but never checked.

**After:** In `validate_api_key()`, after successful validation:
```python
requested_scope = get_scope_for_path(path)  # e.g., "/api/tts/generate" → "tts:generate"
allowed_scopes = key.scopes.split(",")
if requested_scope and requested_scope not in allowed_scopes:
    return None  # Scope not allowed
```

Scope mapping:
| Path Pattern | Scope |
|-------------|-------|
| `/api/tts/*` | `tts:generate` |
| `/api/models/*` | `models:read` |
| `/api/audio/*` | `audio:upload` |
| `/api/library/*` | `library:*` |
| `/api/dictionary/*` | `dictionary:*` |
| Default | `*` (all access) |

### 3.4 Per-Key Rate Limit (FR-6)

**Current:** `rate_limit_dependency()` uses `get_tier_limit(user.subscription_tier)`.

**After:** When request is authenticated via API key, use `key.rate_limit` and `key.rate_limit_window` instead:
```python
if is_api_key_auth:
    limit = key.rate_limit
    window = key.rate_limit_window
else:
    limit, window = get_tier_limit(user.subscription_tier)
```

---

## 4. Implementation Tasks

### Task 1: License Code Hash + Entropy (FR-1, FR-2, FR-7)
- `license_service.py`: `secrets.token_urlsafe(6)` → `token_urlsafe(16)`, bcrypt hash, `datetime.utcnow()` → `datetime.now(timezone.utc)`
- `models/license.py`: add `code_hash: Mapped[str]` column
- Migration: `ALTER TABLE license_keys ADD COLUMN code_hash VARCHAR(255)`
- `schemas/license.py`: LicenseResponse returns `code_display` (first 4 + last 4), full code only on create

### Task 2: Activation Rate Limit + Audit Log (FR-3, FR-4)
- `rate_limiter.py`: add `check_activation_rate_limit()` function (5/IP/min)
- `models/activation_log.py` (NEW): ActivationLog model
- Migration: CREATE TABLE activation_logs
- `license_service.py`: log attempts, check rate limit

### Task 3: API Key Scopes + Per-Key Rate Limit (FR-5, FR-6)
- `auth_service.py`: add scope enforcement in `validate_api_key()`
- `core/scope_map.py` (NEW): path → scope mapping
- `rate_limiter.py`: use per-key limits when API key auth

### Task 4: Auto-Expire Unused Licenses (FR-8)
- `license_service.py`: `get_all_licenses()` filter out expired-by-age (>90 days unused)
- Or: `generate_keys()` marks old unused keys as `is_active=False`

### Task 5: Tests
- `test_license_security.py`: hash verification, entropy, rate limit, audit log
- `test_api_key_scopes.py`: scope enforcement
- Run full suite: 99 passed, 7 failed baseline

---

## 5. Out of Scope

- Changing API key format (keeping `gva_{id}.{secret}`)
- License key format (keeping `{tier}-{days}-{rand}` but adding display code)
- Frontend changes for license key display
- Key rotation notification emails

---

## 6. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-05-05 | v1.0 | Kilo | Initial spec | — | All |
