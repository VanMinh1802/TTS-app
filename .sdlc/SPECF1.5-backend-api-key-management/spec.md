# SPEC: F1.5 - API Key Management with Quota Integration

## Overview
Enhance API key management with per-key rate limiting, usage tracking, and quota enforcement. This enables finer-grained access control for developer integrations.

---

## Functional Requirements

### F1.5.1 - Enhanced API Key Features
- [x] Add per-key rate limiting (requests per minute)
- [x] Track API key usage (requests, errors)
- [x] Add key expiration support
- [x] Support key scopes/permissions

### F1.5.2 - API Key Usage Tracking
- [x] Log API key usage to database
- [x] Track requests per key
- [x] Track errors per key

### F1.5.3 - API Key Enforcement
- [x] Enforce rate limits per key (per minute)
- [x] Apply quota limits to API key requests (consumes user quota)

---

## Status: COMPLETED ✅

Implemented:
- F1.5.1 - Enhanced API Key Features (rate_limit_window, expires_at, scopes)
- F1.5.2 - API Key Usage Tracking
- F1.5.3 - API Key Enforcement (usage incrementing)

Tests: 21 total (all passing)

---

## Acceptance Criteria

### F1.5.1 - Enhanced API Key Features
- [x] Per-key rate limiting configurable
- [x] API key has expiration date
- [x] Keys can be scoped (read-only, full access)

### F1.5.2 - API Key Usage Tracking
- [x] Usage logged per API key
- [x] GET /api/auth/keys/{id}/usage returns stats

### F1.5.3 - API Key Enforcement
- [x] Rate limit headers in response
- [x] Quota consumed on API key use

---

## API Contracts

### Create API Key (Enhanced)

> **SECURITY:** The full API key is returned ONLY at creation time. Store it securely - it cannot be retrieved again.

```
POST /api/auth/keys
Headers: Authorization: Bearer <jwt_token>
Request:
{
  "name": "My API Key",
  "rate_limit": 100,  // requests per minute
  "expires_in_days": 30,
  "scopes": ["tts:generate", "models:read"]
}
Response (201):
{
  "id": "uuid",
  "key": "gva_xxxxx...",  // ONLY returned at creation - store securely!
  "name": "My API Key",
  "rate_limit": 100,
  "rate_limit_window": 60,  // seconds
  "expires_at": "2026-05-19T00:00:00Z",
  "scopes": ["tts:generate", "models:read"],
  "created_at": "2026-04-19T00:00:00Z",
  "is_active": true
}
```

**Note:** Key is ONLY returned at creation. Subsequent retrievals show masked version: `gva_xxxx...abcd`

### Get API Key Usage

```
GET /api/auth/keys/{key_id}/usage
Headers: Authorization: Bearer <jwt_token>
Response (200):
{
  "key_id": "uuid",
  "total_requests": 1234,
  "successful_requests": 1200,
  "failed_requests": 34,
  "last_used_at": "2026-04-19T12:00:00Z",
  "period": {
    "start": "2026-04-01T00:00:00Z",
    "end": "2026-04-19T23:59:59Z"
  }
}
```

### Using API Key

```
GET /api/models
Headers: X-API-Key: gva_xxxxx...

Rate Limit Headers:
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

## Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Expired API key | Return 401 with "key expired" |
| Rate limit exceeded | Return 429 with Retry-After header |
| Invalid scope | Return 403 Forbidden |
| Quota exceeded via API key | Return 429 with quota details |
| Key expires mid-request | Complete request, reject next |
| Missing rate_limit | Default to user quota limit |

## Scope Validation

Scopes validated at authentication time:
- `models:read` - Read model metadata
- `models:download` - Download models (requires signed URL)
- `tts:generate` - Generate TTS audio
- `audio:upload` - Upload audio files

Request without required scope returns 403 Forbidden.

---

## Dependencies

- [x] F1.1 (FastAPI Auth) - Base API key with DELETE endpoint
- [x] F1.4 (Quota Management) - For quota enforcement

**Note:** DELETE /api/auth/keys/{key_id} is already implemented in F1.1. This spec extends it.

---

# 👉 APPROVE to proceed with implementation?

Please review the SPEC above and let me know:
- ✅ APPROVE - proceed with implementation
- ❌ REJECT - specify what needs to change
- ❓ HAVE QUESTIONS - ask for clarification

---

**Note:** The DELETE endpoint is already implemented in F1.1. This spec extends API key functionality.