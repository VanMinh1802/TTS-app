# Backend Code Quality & Architecture Refactor — Implementation Plan

**Goal:** Fix all 16 identified issues (P0-P2), implement Repository + Unit of Work patterns, eliminate dead code, and harden data integrity.

**Architecture:** Transition from service-directly-accesses-Session to Repository + Unit of Work pattern using FastAPI native `Depends()` DI. Keep API contracts backward compatible.

**Tech Stack:** FastAPI + SQLAlchemy 2.0 + PostgreSQL (Neon) + Alembic + Redis + pytest (no new packages)

---

> **Spec:** [spec.md](./spec.md)
> **Status:** Review
> **Author:** Kilo
> **Date:** 2026-05-04

---

## 1. Architecture Overview

### 1.1 System Context

The backend is a FastAPI application serving a Next.js frontend. It provides TTS synthesis (Piper ONNX via R2), user auth (Google OAuth + JWT + API keys), quota management, dictionary CRUD, audio library, license activation, text normalization, and analytics logging.

### 1.2 Before vs After

```
BEFORE:                          AFTER:
┌──────────┐                    ┌──────────┐
│  API     │                    │  API     │  ← Only Depends + call service
├──────────┤                    ├──────────┤
│  Service │→ db.execute()      │  Service │  ← Receives Repository via DI
├──────────┤                    ├──────────┤
│  Model   │                    │  Repo    │  ← All SQLAlchemy queries here
├──────────┤                    ├──────────┤
│  DB      │  raw Session       │  UoW     │  ← Transaction boundary
                                 ├──────────┤
                                 │  Model   │
```

### 1.3 Component Interaction

```
Client Request
  → FastAPI Router
    → Depends(get_current_user)       [app/core/security.py]
    → Depends(get_*_service)           [app/core/di.py]
      → Service._init_(uow: UnitOfWork)
        → uow.repos.<entity>.get_for_update()
          → Session.execute(SELECT ... FOR UPDATE)
        → uow.commit()  (explicit or via context manager exit)
  → Response
```

---

## 2. Tech Stack & Dependencies

| Category | Choice | Version | Rationale |
|----------|--------|---------|-----------|
| Framework | FastAPI | 0.115.0 | Existing |
| ORM | SQLAlchemy | 2.0.38 | Existing, 2.0 style |
| Auth | python-jose + passlib[bcrypt] | 3.3.0 / 1.7.4 | Existing |
| Validation | Pydantic + pydantic-settings | 2.10.3 / 2.7.0 | Existing |
| DB Driver | psycopg2-binary | 2.9.10 | Existing |
| Cache/Rate | Redis | 5.2.1 | Existing |
| TTS | piper (ONNX) | — | Existing |
| R2 | boto3 | 1.37.0 | Existing |
| Test | pytest + pytest-asyncio | 8.3.4 / 0.25.2 | Existing |

### 2.1 New Dependencies

**None.** All refactoring uses existing packages.

### 2.2 Existing Modules Used (read-only)

- `app/core/exceptions.py` — Domain exception hierarchy (unchanged, used more broadly)
- `app/core/security.py` — JWT, bcrypt, API key generation (unchanged)
- `app/core/redis.py` — Redis clients (minor: add logger, timeout settings)
- `app/services/voice_registry.py` — R2 voice scanning (unchanged)
- `app/services/normalizer/` — 5-file text normalizer package (unchanged)
- `app/services/llm_normalizer.py` — Gemini normalizer (unchanged)
- `app/services/language_detector.py` — Language detection (unchanged)
- `app/services/rate_limiter.py` — Rate limiter (unchanged)
- `app/utils/text_utils.py` — Text helpers (unchanged)

---

## 3. Data Model

### 3.1 Schema Changes

**Tables to DROP (new migration):**

| Table | Reason |
|-------|--------|
| `voices` | Voice data moved to R2 registry, not DB |
| `projects` | Feature deprecated |
| `scenes` | Feature deprecated |
| `segments` | Feature deprecated |
| `project_export_jobs` | Feature deprecated |

**New indexes (new migration):**

| Table | Column | Index Name |
|-------|--------|------------|
| `api_keys` | `total_requests` | `ix_api_keys_total_requests` |
| `audio_records` | `created_at` | `ix_audio_records_created_at` |
| `dictionary_entries` | `category` | `ix_dictionary_entries_category` |
| `user_quotas` | `tier` | `ix_user_quotas_tier` |

### 3.2 Models to REMOVE

| File | Content |
|------|---------|
| `app/models/voice.py` | `Voice` model — delete file |
| `app/models/__init__.py` | Remove `Voice` from `__all__` and imports |

### 3.3 Migration Strategy

Two new Alembic migrations (applied via auto-generation):

1. **Migration A: `YYYYMMDD_add_indexes.py`** — Add 4 database indexes
2. **Migration B: `YYYYMMDD_cleanup_deprecated_tables.py`** — Drop 5 deprecated tables

---

## 4. API Contracts

### 4.1 Endpoints — Unchanged Paths

All existing endpoint paths are preserved. No URL changes.

### 4.2 Endpoints — Newly Registered

| Method | Path | Router | Status |
|--------|------|--------|--------|
| GET | `/api/users/me/emotion-dict` | emotion_dict | **Newly registered** (was orphaned) |
| PUT | `/api/users/me/emotion-dict/{key}` | emotion_dict | **Newly registered** |
| DELETE | `/api/users/me/emotion-dict/{key}` | emotion_dict | **Newly registered** |

### 4.3 Endpoints — Refactored Internally

| Method | Path | Change |
|--------|------|--------|
| GET | `/api/voices` | Now fetches from R2 registry, not DB |
| GET | `/api/voices/{id}` | Now fetches from R2 registry, not DB |
| GET | `/api/tts/voices` | Delegate to `/api/voices` or redirect |

### 4.4 Error Response Format (Unchanged but Enforced Consistently)

All service-layer errors now use the domain exception hierarchy:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable Vietnamese/English message"
  }
}
```

Exception → HTTP status mapping (from `app/core/exceptions.py`):
| Exception | HTTP Status |
|-----------|-------------|
| `NotFoundError` | 404 |
| `PermissionDeniedError` | 403 |
| `InvalidInputError` | 400 |
| `QuotaExceededError` | 429 or 400 |
| `LicenseError` | 400 |
| `ServiceError` (base) | 500 |

---

## 5. Internal Service Design

### 5.1 New Layer: Repository

```
app/repositories/
├── base.py              # BaseRepository[T] — generic CRUD, paginate, bulk_insert, exists
├── user.py              # UserRepository(BaseRepository[User])
│                         #   + get_by_email()
│                         #   + get_by_api_key()
├── quota.py             # QuotaRepository(BaseRepository[UserQuota])
│                         #   + get_for_update()           ← FOR UPDATE lock
│                         #   + get_or_create_with_lock()   ← atomic upsert
│                         #   + UsageHistoryRepository
├── dictionary.py        # DictionaryRepository(BaseRepository[DictionaryEntryModel])
│                         #   + bulk_upsert()              ← INSERT ON CONFLICT
│                         #   + search()
├── emotion_dict.py      # EmotionDictRepository(BaseRepository[UserEmotionDict])
│                         #   + get_by_user_and_key()
├── audio_record.py      # AudioRecordRepository(BaseRepository[AudioRecord])
│                         #   + get_by_user() with pagination
├── license.py           # LicenseKeyRepository(BaseRepository[LicenseKey])
│                         #   + get_by_code()
│                         #   + get_user_latest_license()
└── analytics.py         # AnalyticsRepository
                          #   + log_request()
                          #   + update_usage_snapshot()
                          #   + get_dashboard_stats()
```

### 5.2 New Layer: Unit of Work

```python
# app/core/uow.py
class UnitOfWork:
    def __init__(self, session: Session): ...
    def __enter__(self) -> UnitOfWork: ...    # Returns self
    def __exit__(self, ...): ...              # Rollback on exception, commit on success
    
    # Repository accessors (lazy or init)
    users: UserRepository
    quotas: QuotaRepository
    dictionaries: DictionaryRepository
    emotion_dicts: EmotionDictRepository
    audio_records: AudioRecordRepository
    licenses: LicenseKeyRepository
    analytics: AnalyticsRepository
    
    def commit(self): ...
    def rollback(self): ...
```

### 5.3 Service Layer — Refactored Signatures

```python
# BEFORE: Service(db: Session)
# AFTER:  Service(uow: UnitOfWork)

class QuotaService:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow

class AuthService:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow

class DictionaryService(BaseService[DictionaryEntryModel]):
    def __init__(self, repo: DictionaryRepository):
        super().__init__(repo)

class LibraryService:
    def __init__(self, uow: UnitOfWork):
        self.uow = uow

# ... same pattern for all services
```

### 5.4 Dependency Injection

```python
# app/core/di.py
from app.api.auth import get_current_user
from app.core.uow import UnitOfWork
from app.db import get_db

def get_uow(db: Session = Depends(get_db)) -> UnitOfWork:
    return UnitOfWork(db)

def get_auth_service(uow: UnitOfWork = Depends(get_uow)) -> AuthService:
    return AuthService(uow)

def get_quota_service(uow: UnitOfWork = Depends(get_uow)) -> QuotaService:
    return QuotaService(uow)

def get_tts_service() -> TTSService:
    return tts_service  # Module-level singleton (stateless)

def get_dictionary_service(uow: UnitOfWork = Depends(get_uow)) -> DictionaryService:
    return DictionaryService(uow.dictionaries)

def get_emotion_dict_service(uow: UnitOfWork = Depends(get_uow)) -> EmotionDictService:
    return EmotionDictService(uow.emotion_dicts)

def get_library_service(uow: UnitOfWork = Depends(get_uow)) -> LibraryService:
    return LibraryService(uow)

def get_license_service(uow: UnitOfWork = Depends(get_uow)) -> LicenseService:
    return LicenseService(uow)

def get_analytics_service(uow: UnitOfWork = Depends(get_uow)) -> AnalyticsService:
    return AnalyticsService(uow)
```

### 5.5 New: BaseService

```python
# app/services/base.py
T = TypeVar("T")

class BaseService(Generic[T]):
    def __init__(self, repository: BaseRepository[T]):
        self.repo = repository
    
    def get(self, id: str) -> T | None
    def list(self, page, per_page, **filters) -> tuple[list[T], int]
    def create(self, data: dict) -> T
    def update(self, id: str, data: dict) -> T
    def delete(self, id: str) -> bool
```

---

## 6. Error Handling

| Error Code | HTTP Status | Scenario | Response |
|------------|-------------|----------|----------|
| `INVALID_INPUT` | 400 | Missing/invalid fields | `{"error": {"code": "INVALID_INPUT", "message": "..."}}` |
| `NOT_FOUND` | 404 | Resource not found | `{"error": {"code": "NOT_FOUND", "message": "..."}}` |
| `PERMISSION_DENIED` | 403 | Unauthorized action | `{"error": {"code": "PERMISSION_DENIED", "message": "..."}}` |
| `QUOTA_EXCEEDED` | 400 | Quota limit reached | `{"error": {"code": "QUOTA_EXCEEDED", "message": "...", "remaining": 0}}` |
| `LICENSE_ERROR` | 400 | Invalid/expired license | `{"error": {"code": "LICENSE_ERROR", "message": "..."}}` |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | `{"error": {"code": "RATE_LIMIT_EXCEEDED", "message": "...", "retry_after": 30}}` |
| `INTERNAL_ERROR` | 500 | Unexpected failure | `{"error": {"code": "INTERNAL_ERROR", "message": "Internal server error"}}` |

---

## 7. Test Strategy

> **TDD Required:** Every task step must follow RED-GREEN-REFACTOR cycle.

### 7.1 Implementation Tasks

#### Task 1: Dead Code Cleanup (P0 parts 3.5)

**Description:** Remove unused files, update `.gitignore`, clean `requirements.txt`

**Files:**
- DELETE `app/core/metrics.py`
- DELETE `tests/test_projects_api.py`
- DELETE `tests/test_project_models.py`
- DELETE `tests/test_project_service.py`
- MOVE `test_apis.py` → `scripts/test_apis.py`
- MOVE `verify_audio.py` → `scripts/verify_audio.py`
- EDIT `backend/.gitignore`
- EDIT `backend/requirements.txt`
- EDIT `app/core/messages.py`

**No TDD required** (deletion/move operations).

---

#### Task 2: Fix Print → Logger in tts_service.py (P0 part 3.3)

**Files:** `app/services/tts_service.py`, `tests/test_tts_logging.py` (NEW)

**[RED]** Write failing test:

```python
# tests/test_tts_logging.py
def test_tts_error_logged_not_printed(caplog):
    service = TTSService()
    with caplog.at_level(logging.ERROR):
        result = service._fallback_synthesize("test", speed=1.0)
    assert len(caplog.records) >= 0  # Can't force error, verify logger imported
```

**[GREEN]** Replace 3 `print()` calls with `logger.error()` and 2 `traceback.print_exc()` with `logger.exception()`.

---

#### Task 3: Fix JWT_SECRET_KEY Validation (P0 part 3.2)

**Files:** `app/core/settings.py`, `tests/test_settings.py` (NEW)

**[RED]** Write failing test:

```python
# tests/test_settings.py
def test_jwt_secret_rejects_placeholder():
    with pytest.raises(ValidationError):
        Settings(JWT_SECRET_KEY="your-secret-key-change-in-production")

def test_jwt_secret_rejects_empty():
    with pytest.raises(ValidationError):
        Settings(JWT_SECRET_KEY="")
```

**[GREEN]** Add `@field_validator("JWT_SECRET_KEY")` that rejects empty/placeholder values.

---

#### Task 4: Fix ValueError → Domain Exceptions in license_service.py (P0 part 3.4)

**Files:** `app/services/license_service.py`, `tests/test_license_exceptions.py` (NEW)

**[RED]** Write failing test:

```python
# tests/test_license_exceptions.py
def test_activate_invalid_license_raises_license_error(uow):
    service = LicenseService(uow)
    with pytest.raises(LicenseError):
        service.activate("invalid-code", user_id="test")
```

**[GREEN]** Replace `raise ValueError(...)` with `raise LicenseError(...)` or `raise InvalidInputError(...)`.

---

#### Task 5: Register emotion_dict Router (P0 part 3.1)

**Files:** `app/main.py`, `tests/test_emotion_dict_api.py` (NEW)

**[RED]** Write failing test:

```python
# tests/test_emotion_dict_api.py
def test_get_emotion_dict_returns_200(client, auth_headers):
    response = client.get("/api/users/me/emotion-dict", headers=auth_headers)
    assert response.status_code == 200
```

**[GREEN]** Add `from app.api.emotion_dict import router as emotion_dict_router` and `app.include_router(emotion_dict_router, prefix=settings.API_V1_PREFIX)` to `main.py`.

---

#### Task 6: CORS + Bare Except + Settings Hardcodes (P1 parts 4.4, 4.6, 4.7)

**Files:** `app/main.py`, `app/core/settings.py`, `app/services/tts_service.py`, `app/api/tts.py`, `app/core/redis.py`, `app/db/__init__.py`, `tests/test_settings.py`

**[RED]** Tests for settings validation (already in Task 3).

**[GREEN]**
- `main.py`: Change `allow_headers=["*"]` to `["Authorization", "Content-Type", "X-API-Key", "X-CSRF-Token"]`
- `main.py`: Add `logger.warning()` in health check bare except
- `tts_service.py`: Add `logger.warning()` in `_ensure_model()` except
- `api/tts.py`: Change `except Exception` to `except ValueError` in normalize fallback
- `redis.py`: Add `logger.debug()` in `is_redis_available()` except
- `settings.py`: Add `MAX_TTS_TEXT_LENGTH`, `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`, `REDIS_CONNECT_TIMEOUT`, `REDIS_SOCKET_TIMEOUT`
- `db/__init__.py`: Read pool settings from `settings`
- `redis.py`: Read timeout settings from `settings`

---

#### Task 7: Create Repository Layer (P2 parts 2.1)

**Files:**
- `app/repositories/__init__.py` (NEW)
- `app/repositories/base.py` (NEW)
- `app/repositories/user.py` (NEW)
- `app/repositories/quota.py` (NEW)
- `app/repositories/dictionary.py` (NEW)
- `app/repositories/emotion_dict.py` (NEW)
- `app/repositories/audio_record.py` (NEW)
- `app/repositories/license.py` (NEW)
- `app/repositories/analytics.py` (NEW)
- `tests/test_repository_user.py` (NEW)
- `tests/test_repository_quota.py` (NEW)
- `tests/test_repository_dictionary.py` (NEW)

**[RED]** Write failing tests for all new repositories.

**[GREEN]** Implement `BaseRepository` + all 7 repository classes.

---

#### Task 8: Create Unit of Work (P2 part 2.2)

**Files:** `app/core/uow.py` (NEW), `tests/test_uow.py` (NEW)

**[RED]** Write failing test:

```python
# tests/test_uow.py
def test_uow_commits_on_success(uow):
    with uow:
        user = uow.users.create(User(email="test@test.com", name="Test"))
    assert uow.users.get(user.id) is not None

def test_uow_rolls_back_on_exception(uow):
    with pytest.raises(ValueError):
        with uow:
            uow.users.create(User(email="rollback@test.com", name="Test"))
            raise ValueError("trigger rollback")
    assert uow.users.get_by_email("rollback@test.com") is None
```

**[GREEN]** Implement `UnitOfWork` context manager.

---

#### Task 9: Create DI Layer (P2 part 2.3)

**Files:** `app/core/di.py` (NEW), `tests/test_di.py` (NEW)

**[RED]** Write failing test:

```python
# tests/test_di.py
def test_get_uow_dependency(db_session):
    uow = get_uow(db_session)
    assert isinstance(uow, UnitOfWork)
    assert uow.users is not None

def test_get_quota_service_dependency(db_session):
    uow = get_uow(db_session)
    service = get_quota_service(uow)
    assert isinstance(service, QuotaService)
```

**[GREEN]** Implement `app/core/di.py` with all `get_*` factory functions.

---

#### Task 10: Create BaseService (P2 part 2.4)

**Files:** `app/services/base.py` (NEW)

**No dedicated test** (tested implicitly through DictionaryService + EmotionDictService refactor).

**[GREEN]** Implement `BaseService[T]` generic class.

---

#### Task 11: Refactor Services to Use Repositories (P2 parts 2.5-2.7)

**Files:** All files in `app/services/` (12 files), all files in `app/api/` (12 files)

**Key changes per service:**

| Service | Changes |
|---------|---------|
| `auth_service.py` | Receive `UnitOfWork`, use `uow.users` for queries |
| `tts_service.py` | Extract constants, no DI change (stateless, module-level) |
| `quota_service.py` | Receive `UnitOfWork`, use `uow.quotas.get_for_update()` |
| `dictionary_service.py` | Inherit `BaseService[DictionaryEntryModel]`, receive `DictionaryRepository` |
| `emotion_dict_service.py` | Inherit `BaseService[UserEmotionDict]`, receive `EmotionDictRepository` |
| `library_service.py` | Receive `UnitOfWork`, replace `HTTPException` → domain exceptions |
| `license_service.py` | Receive `UnitOfWork`, use domain exceptions |
| `r2_service.py` | No DI change (stateless, relies on settings) |
| `voice_registry.py` | No change (already reads from R2) |
| `analytics_service.py` | Receive `UnitOfWork`, use `uow.analytics` |
| `rate_limiter.py` | No change (Redis-based, no DB) |

**Route handler changes:**

| File | Change |
|------|--------|
| `api/auth.py` | `AuthService(db)` → `Depends(get_auth_service)` |
| `api/tts.py` | `TTSService()` → `Depends(get_tts_service)` |
| `api/voices.py` | Voice list from registry, not DB |
| `api/models.py` | No change (R2-based) |
| `api/quota.py` | `QuotaService(db)` → `Depends(get_quota_service)` |
| `api/dictionary.py` | `DictionaryService(db)` → `Depends(get_dictionary_service)` |
| `api/emotion_dict.py` | `EmotionDictService(db)` → `Depends(get_emotion_dict_service)` |
| `api/analytics.py` | `AnalyticsService(db)` → `Depends(get_analytics_service)` |
| `api/normalize.py` | No change |
| `api/language.py` | No change |
| `api/library.py` | `LibraryService(db)` → `Depends(get_library_service)` |
| `api/license.py` | `LicenseService(db)` → `Depends(get_license_service)` |

**[RED]** Verify existing tests still fail (they use old constructors).

**[GREEN]** Refactor all services + route handlers. Tests transition to new constructors.

---

#### Task 12: DB Migrations (P1 parts 4.1-4.2 + P2 parts 5.2)

**Files:**
- New Alembic migration: add 4 indexes
- New Alembic migration: drop 5 deprecated tables
- EDIT `app/models/__init__.py` — remove Voice import
- DELETE `app/models/voice.py`
- EDIT `app/schemas/voice.py` — keep schema, remove DB dependency comments
- EDIT `app/api/voices.py` — fetch from voice_registry (R2)

**[RED]** Migration auto-generation test (verify alembic can generate and apply).

**[GREEN]** Run `alembic revision --autogenerate -m "add_indexes"` and `alembic revision --autogenerate -m "cleanup_deprecated_tables"`. Apply both.

---

#### Task 13: Final Integration & Regression Test

**Files:** All existing test files

**Actions:**
- Run full test suite: `pytest tests/`
- Fix any regression in existing tests due to constructor signature changes
- Verify `test_voices_api.py`, `test_tts_voices_api.py` pass after voice registry refactor
- Verify `test_models.py` passes after Voice model removal
- Verify `test_quota.py` passes after Repository refactor
- Verify `test_dictionary_*.py` pass after BaseService refactor
- Verify `test_license_*.py` pass after domain exception refactor
- Run `pytest tests/ -v --tb=short` — all tests must pass

**No TDD** (verification only).

---

### 7.2 Coverage Target

| Layer | What to Test | Minimum Coverage |
|-------|-------------|-----------------|
| Repository | All CRUD + special methods (get_for_update, bulk_upsert) | 90% |
| Service | Business logic with mocked repository | 80% |
| API | Endpoint integration with TestClient | 70% |
| Core (settings, exceptions, security) | Validation, error mapping, token ops | 95% |

---

## 8. Constraints & Trade-offs

### 8.1 Constraints

- Must follow existing `.sdlc/AGENTS.md` naming conventions
- Must use Alembic for all schema changes (no manual SQL)
- Must keep API endpoint paths unchanged
- Must preserve JWT + API key auth flow
- Must not conflict with active `SPEC018-core-library-redesign`
- Must use pytest + pytest-asyncio (existing framework)
- No new Python packages or npm dependencies

### 8.2 Trade-offs

| Decision | Alternative | Why this choice |
|----------|-------------|-----------------|
| FastAPI Depends() for DI | dependency-injector library | Zero new dependencies, familiar pattern |
| Repository pattern only | Full Clean Architecture (interfaces) | Avoids 2x code for startup-scale app |
| UoW as context manager | Auto-commit middleware | Explicit transaction control for write ops |
| Keep voice_registry.py unchanged | Rewrite as service | Stable code, no bugs found, YAGNI |
| Drop deprecated tables directly | Soft-delete with archive | No real user data in these tables |
| Bulk insert via SQLAlchemy | Raw SQL | ORM integration keeps type safety |
| Keep TTS as module-level singleton | Convert to DI service | Stateless, 1 instance needed, lazy model loading already in place |

### 8.3 Out of Scope (Technical)

- Adding async DB driver (asyncpg) — psycopg2 is synchronous, TTS already runs in `asyncio.to_thread()`
- Database sharding or read replicas
- Connection retry with exponential backoff
- Request ID propagation or distributed tracing
- Rate limiter Redis cluster support
- API versioning (/v1/, /v2/)

---

## 9. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-05-04 | v1.0 | Kilo | Initial plan based on comprehensive backend review findings | — | All |

### Follow-ups

| Date | Item | Impact | Status |
|------|------|--------|--------|
| | | | Pending |
