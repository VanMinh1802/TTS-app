# SPEC: F1.4 - Quota Management System

## Overview
Implement a quota management system to track user resource usage (API calls, audio generation minutes, storage). This enables tiered access control and rate limiting for the SaaS platform.

---

## Functional Requirements

### F1.4.1 - Quota Model
- [x] Define quota tiers (free tier for MVP, others future)
- [x] Track usage per user (characters, storage, API calls)
- [x] Store quota data in PostgreSQL

### F1.4.2 - Quota Constraints
- [x] Enforce quota limits on API usage
- [x] Return remaining quota in responses
- [x] Handle quota exceeded scenarios

### F1.4.3 - Quota API
- [x] GET /api/quota - Get current quota status
- [x] GET /api/quota/usage - Get usage history

---

## Acceptance Criteria

### F1.4.1 - Quota Model
- [x] Quota tiers defined and configurable
- [x] Usage tracked per user
- [x] Quota data persists in PostgreSQL

### F1.4.2 - Quota Constraints
- [x] API returns 429 when quota exceeded
- [x] Response includes remaining quota headers

### F1.4.3 - Quota API
- [x] `GET /api/quota` returns current quota status
- [x] `GET /api/quota/usage` returns usage history

---

## API Contracts

### Get Quota Status

```
GET /api/quota
Headers: Authorization: Bearer <jwt_token>

Response (200):
{
  "tier": "free",
  "limits": {
    "characters_per_month": 5000,
    "storage_mb": 100,
    "api_calls_per_day": 100
  },
  "usage": {
    "characters_this_month": 1250,
    "storage_used_mb": 25,
    "api_calls_today": 45
  },
  "remaining": {
    "characters": 3750,
    "storage_mb": 75,
    "api_calls": 55
  },
  "reset_at": "2026-05-01T00:00:00Z"
}
```

### Get Usage History

```
GET /api/quota/usage
Headers: Authorization: Bearer <jwt_token>

Response (200):
{
  "history": [
    {
      "date": "2026-04-19",
      "characters_used": 1250,
      "api_calls": 45,
      "storage_mb": 25
    }
  ]
}
```

---

## Quota Tiers

> **Scope Note:** This implementation covers only the FREE tier. Paid tiers (Basic/Pro/Enterprise) are future scope pending billing/payment integration.

| Tier | Characters/Month | Storage | API Calls/Day | Status |
|------|-----------------|---------|---------------|--------|
| free | 5,000 | 100 MB | 100 | ✅ Implemented |
| basic | 50,000 | 1 GB | 1,000 | Future |
| pro | 200,000 | 5 GB | 5,000 | Future |
| enterprise | Unlimited | 50 GB | Unlimited | Future |

---

## Scope Clarification

**Out of Scope (Future):**
- Tier upgrade mechanism (admin API)
- Payment integration (Stripe, etc.)
- Paid tiers (Basic/Pro/Enterprise)
- Automatic quota reset scheduling

**This Implementation:**
- Free tier only
- Manual quota reset via API endpoint
- Usage tracking for monitoring

---

## Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Quota exceeded | Return 429 Too Many Requests with details |
| New user (no quota record) | Auto-create with free tier |
| Invalid tier | Fall back to free tier |
| Usage reset (new month) | Reset counters, keep history |

---

## Configuration

```python
# Quota Tiers (in settings)
QUOTA_TIERS = {
    "free": {"characters": 5000, "storage_mb": 100, "api_calls": 100},
    "basic": {"characters": 50000, "storage_mb": 1024, "api_calls": 1000},
    "pro": {"characters": 200000, "storage_mb": 5120, "api_calls": 5000},
    "enterprise": {"characters": None, "storage_mb": 51200, "api_calls": None},
}

# Default tier for new users
DEFAULT_QUOTA_TIER = "free"
```

---

## Dependencies

- [x] F1.1 (FastAPI Auth) - Required for authenticated endpoints
- [x] F1.2 (PostgreSQL) - Required for quota storage

---

## Status: COMPLETED ✅

Implemented:
- F1.4.1 - Quota Model (free tier)
- F1.4.2 - Quota Constraints
- F1.4.3 - Quota API

Tests: 21 total (9 auth + 7 models + 5 quota)

---

# 👉 APPROVE to proceed with implementation?

Please review the SPEC above and let me know:
- ✅ APPROVE - proceed with implementation
- ❌ REJECT - specify what needs to change
- ❓ HAVE QUESTIONS - ask for clarification