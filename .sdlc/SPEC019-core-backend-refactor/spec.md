# Feature: Backend Code Quality & Architecture Refactor

> **Status:** Review
> **Author:** Kilo
> **Date:** 2026-05-04
> **Related Issues:** N/A (comprehensive code review findings)

---

## 1. Problem Statement

### 1.1 User Problem

The backend codebase has accumulated technical debt across multiple development cycles: dead code, orphaned routers, race conditions in quota consumption, hardcoded secrets defaults, inconsistent error handling, and missing architectural abstractions (Repository pattern, Unit of Work). This reduces developer velocity, increases bug risk, and makes the codebase harder to test and maintain.

### 1.2 Business Impact

- **Bug risk:** JWT_SECRET_KEY has a weak default placeholder causing authentication bypass risk if `.env` is missing
- **Feature gap:** `/api/users/me/emotion-dict` endpoints are defined but never registered — entire feature is unreachable
- **Data integrity:** Quota consumption has race conditions (no `SELECT ... FOR UPDATE` locking) — users can exceed quota limits
- **Maintenance cost:** Dead code, orphaned test files, and inconsistent patterns increase onboarding time for new developers
- **Performance debt:** Missing database indexes, N+1 queries, no batch insert optimization

### 1.3 Success Criteria

- [ ] All 16 identified issues (P0, P1, P2) resolved
- [ ] Repository pattern implemented for all 7 model entities
- [ ] Unit of Work pattern replaces ad-hoc `db.commit()` calls
- [ ] 100% of Service layer exceptions use domain exception hierarchy
- [ ] `print()` and `traceback.print_exc()` eliminated from production code
- [ ] All tests pass with no regression (except 3 deleted mồ côi test files)
- [ ] New test coverage: Repository layer 90%+, Service layer 80%+
- [ ] API contracts unchanged (endpoint paths, auth mechanism preserved)
- [ ] Frontend unaffected (response format backwards compatible)

---

## 2. User Stories & Acceptance Criteria

### Story 1: Fix Critical Bugs (P0)

**As a** developer,
**I want** all P0 bugs to be fixed,
**so that** the backend operates correctly and securely.

#### Acceptance Criteria

- **Given** the FastAPI app starts,
  **When** I call `GET /api/users/me/emotion-dict`,
  **Then** it returns 200 (not 404).

- **Given** the `.env` file is missing,
  **When** the app tries to load `JWT_SECRET_KEY`,
  **Then** it raises a clear error instead of using the placeholder default.

- **Given** a TTS synthesis error occurs,
  **When** the Piper engine fails,
  **Then** the error is logged via `logger.exception()` not `print()`.

- **Given** a license activation fails,
  **When** `LicenseService.activate()` catches the error,
  **Then** it raises `LicenseError` not `ValueError`.

- **Given** `app/core/metrics.py` exists,
  **When** any module imports from `app.core`,
  **Then** `metrics` is never imported (dead — removed).

### Story 2: Data Integrity & Performance (P1)

**As a** developer,
**I want** race conditions eliminated and performance optimized,
**so that** the app behaves correctly under concurrent load.

#### Acceptance Criteria

- **Given** two concurrent requests consume quota for the same user,
  **When** both call `QuotaService.consume_characters()`,
  **Then** only one succeeds when quota is near limit (no over-consumption).

- **Given** 100 dictionary entries are imported at once,
  **When** `DictionaryService.bulk_import()` is called,
  **Then** a single SQL `INSERT ... ON CONFLICT` statement is used (not 100 individual inserts).

- **Given** any API endpoint returns an error,
  **When** the error is logged,
  **Then** the bare `except Exception: pass` pattern is replaced with `logger.warning()` or `logger.debug()`.

- **Given** the app starts,
  **When** any module loads,
  **Then** `.pyc`, `.pytest_cache`, `*.wav` files are ignored by git.

### Story 3: Architecture Refactor (P2)

**As a** developer,
**I want** a clean layered architecture with Repository and Unit of Work patterns,
**so that** the code is testable, maintainable, and follows SOLID principles.

#### Acceptance Criteria

- **Given** a service needs to query users,
  **When** `AuthService` is instantiated,
  **Then** it receives `UserRepository` via constructor (not `Session` directly).

- **Given** multiple database writes must be atomic,
  **When** `QuotaService.consume_characters()` runs,
  **Then** it uses `UnitOfWork` context manager with auto commit/rollback.

- **Given** the API layer handles an exception,
  **When** a service raises a domain exception,
  **Then** `app/core/exceptions.py` maps it to the correct HTTP status code.

- **Given** `DictionaryService` and `EmotionDictService` exist,
  **When** reviewing their code,
  **Then** they share a `BaseService` class eliminating duplicated CRUD logic.

- **Given** the `voices` and `projects`/`scenes`/`segments` features are deprecated,
  **When** the codebase is scanned,
  **Then** no models, routes, or migrations reference them.

---

## 3. Functional Requirements

### 3.1 Core Behaviors

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Register `emotion_dict` router in `main.py` | Must |
| FR-2 | Remove default placeholder for `JWT_SECRET_KEY`, add startup validation | Must |
| FR-3 | Replace all `print()` and `traceback.print_exc()` with `logger` in `tts_service.py` | Must |
| FR-4 | Replace `ValueError` raises with domain exceptions in `license_service.py` | Must |
| FR-5 | Remove `app/core/metrics.py` (dead code) | Must |
| FR-6 | Delete orphaned test files: `test_projects_api.py`, `test_project_models.py`, `test_project_service.py` | Must |
| FR-7 | Move `test_apis.py` and `verify_audio.py` to `scripts/` directory | Must |
| FR-8 | Add `*.wav`, `*.pyc`, `.pytest_cache/`, `venv/` to `.gitignore` | Must |
| FR-9 | Remove `python-json-logger` from `requirements.txt` | Must |
| FR-10 | Add `SELECT ... FOR UPDATE` locking to `QuotaRepository` consume operations | Must |
| FR-11 | Add database indexes: `api_keys.total_requests`, `audio_records.created_at`, `dictionary_entries.category`, `user_quotas.tier` | Must |
| FR-12 | Replace individual `db.add()` with `bulk_insert_mappings` in dictionary import | Must |
| FR-13 | Consolidate voice listing: remove duplicate in `tts.py`, keep `voices.py` as canonical — fetch from R2 registry, not DB | Must |
| FR-14 | Narrow CORS `allow_headers` from `["*"]` to explicit list | Must |
| FR-15 | Add logging to all bare `except Exception: pass` blocks (4 locations) | Must |
| FR-16 | Remove `Voice` model from `app/models/`, delete `voices` table via migration | Must |
| FR-17 | Drop `projects`, `scenes`, `segments`, `project_export_jobs` tables via migration | Must |
| FR-18 | Create `app/repositories/` layer with 7 repository classes + `BaseRepository` | Must |
| FR-19 | Create `app/core/uow.py` with `UnitOfWork` context manager | Must |
| FR-20 | Create `app/services/base.py` with `BaseService` for shared CRUD | Must |
| FR-21 | Create `app/core/di.py` with `get_*_service` FastAPI dependency functions | Must |
| FR-22 | Refactor all services to receive repositories via constructor (not `Session`) | Must |
| FR-23 | Refactor `library_service.py`: replace `HTTPException` raises with domain exceptions | Must |
| FR-24 | Extract repeated constants (`SAMPLE_RATE`, `DEFAULT_NOISE_SCALE`, etc.) in `tts_service.py` | Must |
| FR-25 | Move hardcoded config values to `Settings`: `MAX_TTS_TEXT_LENGTH`, `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`, `REDIS_CONNECT_TIMEOUT`, `REDIS_SOCKET_TIMEOUT` | Must |
| FR-26 | Remove `notifications` key from `app/core/messages.py` if unused | Should |

### 3.2 Edge Cases

- Two concurrent users consume quota simultaneously: row-level lock prevents double-consumption
- Dictionary import with duplicate words: `ON CONFLICT (user_id, word) DO UPDATE` handles idempotently
- Redis unavailable during rate limiting: fail open (allow request, log warning)
- Database connection lost mid-request: UnitOfWork rolls back transaction
- Emotion dict router registered: verify no route conflicts with existing routers
- Voice listing from R2: handle case where R2 is unreachable → fallback to hardcoded registry
- Migration drops tables with data: only safe because app is pre-production (no real user data in projects/scenes/segments/voices tables)

### 3.3 Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| JWT_SECRET_KEY is empty or placeholder | App fails to start with clear error message |
| License activation with invalid code | `LicenseError` → 400 with structured response |
| Library upload exceeds quota | `QuotaExceededError` → 400 with remaining quota info |
| TTS model fails to load from R2 | `logger.error()` with model details, fallback synthesis |
| Redis ping fails on startup | `logger.warning()`, rate limiting bypassed (fail open) |
| DB health check fails | `logger.warning()` with exception details |
| Emotion dict endpoint called without auth | 401 via existing `get_current_user` dependency |
| Concurrent quota consume over limit | One request gets `QuotaExceededError`, other succeeds |

---

## 4. Non-Functional Requirements

### 4.1 Performance

- Dictionary bulk import: single SQL statement regardless of entry count
- Quota consume: constant-time with row-level lock (no table scan)
- Voice listing: served from in-memory registry cache (no DB or R2 calls per request)
- Repository queries: all filterable columns have indexes
- UnitOfWork: connection returned to pool immediately on context exit

### 4.2 Security

- JWT_SECRET_KEY must be set explicitly (no default)
- CORS headers restricted to: `Authorization`, `Content-Type`, `X-API-Key`, `X-CSRF-Token`
- API response error messages via structured `ServiceError` hierarchy (no raw exceptions)
- No secrets or keys in log output

### 4.3 Constraints

- Platform: FastAPI + SQLAlchemy 2.0 + PostgreSQL (Neon)
- Dependencies: No new packages added; use existing `fastapi`, `sqlalchemy`, `pydantic`, `alembic`
- Must work with existing frontend (API contracts backward compatible)
- Must work with existing `SPEC018-core-library-redesign` (no conflicts with library service changes)
- Alembic migration chain must remain intact (no squashing existing migrations)
- Test framework: pytest + pytest-asyncio (existing)

---

## 5. Unit Test Cases (TDD)

> **TDD Required:** Every test case below must be implemented using RED-GREEN-REFACTOR cycle.

### 5.1 Test Case Registry

| ID | File | Description | Status |
|----|------|-------------|--------|
| TC-01 | `tests/test_emotion_dict_api.py` | Emotion dict endpoints return 200 after router registration | RED |
| TC-02 | `tests/test_settings.py` | JWT_SECRET_KEY validates at startup (rejects empty/placeholder) | RED |
| TC-03 | `tests/test_tts_logging.py` | TTS errors logged via logger.exception() not print() | RED |
| TC-04 | `tests/test_license_exceptions.py` | License errors use domain exceptions with correct HTTP mapping | RED |
| TC-05 | `tests/test_repository_quota.py` | QuotaRepository.get_for_update() prevents race condition | RED |
| TC-06 | `tests/test_repository_user.py` | UserRepository CRUD + get_by_email | RED |
| TC-07 | `tests/test_repository_dictionary.py` | DictionaryRepository bulk_upsert with ON CONFLICT DO UPDATE | RED |
| TC-08 | `tests/test_repository_analytics.py` | AnalyticsRepository request logging and usage aggregation | RED |
| TC-09 | `tests/test_uow.py` | UnitOfWork commits on success, rolls back on exception | RED |
| TC-10 | `tests/test_di.py` | Dependency injection chain resolves correctly (get_uow → get_*_service) | RED |
| TC-11 | `tests/test_quota.py` | Concurrent quota consume: only one succeeds at limit | RED |
| TC-12 | `tests/test_auth.py` | API key validation with bcrypt caching (NEW — auth gap fill) | RED |

### 5.2 Test Cases to Verify (Existing Tests)

| ID | File | Verify |
|----|------|--------|
| TV-01 | `tests/test_voices_api.py` | Voice listing works via R2 registry (not DB query) |
| TV-02 | `tests/test_tts_voices_api.py` | TTS voice endpoints consolidated |
| TV-03 | `tests/test_dictionary_api.py` | Dictionary CRUD works after Repository refactor |
| TV-04 | `tests/test_dictionary_service.py` | Dictionary service works after BaseService refactor |
| TV-05 | `tests/test_license_api.py` | License endpoints return domain exception responses |
| TV-06 | `tests/test_license_service.py` | License service uses domain exceptions |
| TV-07 | `tests/test_rate_limit.py` | Rate limiter unchanged behavior |
| TV-08 | `tests/test_tts_service.py` | TTS synthesis works after constant extraction |
| TV-09 | `tests/test_normalizer_*.py` | All normalizer tests unchanged |
| TV-10 | `tests/test_models.py` | Model tests updated (Voice model removed) |

### 5.3 Test Cases Removed

| File | Reason |
|------|--------|
| `tests/test_projects_api.py` | Projects feature deprecated |
| `tests/test_project_models.py` | Projects feature deprecated |
| `tests/test_project_service.py` | Projects feature deprecated |

---

## 6. Boundaries

### [ALLOW] Always Do

- Use existing `pytest` + `pytest-asyncio` framework
- Follow existing FastAPI `Depends()` pattern for DI
- Use SQLAlchemy 2.0 `Mapped[T]` and `mapped_column()` style
- Keep API endpoint paths unchanged
- Keep existing JWT + API key auth mechanism
- Run `pytest` before each commit

### [CAUTION] Ask First

- Adding new Python packages (should not be needed)
- Changing error response format visible to frontend
- Modifying auth flow or token structure
- Changing `SPEC018` library endpoints (active development)

### [FORBID] Never Do

- Write production code before writing a failing test (TDD)
- Squash or modify existing Alembic migrations
- Change database URL or connection string format
- Remove columns from tables that frontend depends on
- Commit secrets, API keys, or `.env` files
- Skip RED-GREEN-REFACTOR cycle for any test case
- Raise `HTTPException` in Service layer (use domain exceptions)

---

## 7. Verification

### 7.1 Test Plan

| Requirement | Test Method | TDD Status |
|-------------|-------------|------------|
| FR-1 (emotion dict router) | Integration test | Pending (RED) |
| FR-2 (JWT_SECRET validation) | Unit test | Pending (RED) |
| FR-3 (print → logger) | Unit test (caplog) | Pending (RED) |
| FR-4 (ValueError → domain) | Unit test | Pending (RED) |
| FR-5..9 (dead code cleanup) | Manual verification | N/A |
| FR-10 (FOR UPDATE lock) | Integration test (2 threads) | Pending (RED) |
| FR-11 (DB indexes) | Manual + EXPLAIN ANALYZE | N/A |
| FR-12 (bulk insert) | Unit test | Pending (RED) |
| FR-13 (voice listing) | Integration test | Pending (RED) |
| FR-14 (CORS headers) | Manual + test client | N/A |
| FR-15 (bare except → logger) | Unit test (caplog) | Pending (RED) |
| FR-16..17 (drop tables) | Migration test | N/A |
| FR-18..22 (Repository + UoW + DI) | Unit + integration tests | Pending (RED) |
| FR-23 (HTTPException → domain) | Unit test | Pending (RED) |
| FR-24..25 (constants + settings) | Unit test | Pending (RED) |
| FR-26 (messages cleanup) | Manual verification | N/A |

### 7.2 Acceptance Checklist

- [ ] All P0 bugs fixed and verified
- [ ] All P1 improvements implemented and under test
- [ ] All P2 architectural changes completed
- [ ] All 12 new/replacement test cases pass (RED → GREEN → REFACTOR)
- [ ] All 10 existing test verifications pass (no regression)
- [ ] Emotion dict endpoints accessible at `/api/users/me/emotion-dict`
- [ ] JWT_SECRET_KEY validation prevents startup with placeholder
- [ ] No `print()` or `traceback.print_exc()` in `app/` directory
- [ ] No `ValueError` raised in `license_service.py`
- [ ] No `HTTPException` raised in any service file
- [ ] Repository layer has 90%+ test coverage
- [ ] Service layer has 80%+ test coverage
- [ ] `SELECT ... FOR UPDATE` used in quota consume path
- [ ] `bulk_insert_mappings` used in dictionary import
- [ ] CORS allow_headers is explicit list, not `["*"]`
- [ ] `.gitignore` covers all generated/artifact files
- [ ] `requirements.txt` has no unused packages
- [ ] No orphaned model files for deprecated features
- [ ] Alembic migration chain unbroken
- [ ] `pytest` passes with zero failures
- [ ] Frontend API integration unaffected

---

## 8. Out of Scope

- Adding Celery or background task queue
- Implementing full Clean Architecture (interfaces/abstract classes)
- Changing from HS256 to RS256 for JWT
- Adding WebSocket support
- Setting up CI/CD pipeline
- Adding OpenTelemetry or structured JSON logging
- Refactoring `voice_registry.py` logic (kept as-is)
- Refactoring text normalizer package (kept as-is)
- Changing the license key generation algorithm
- Modifying the LLM normalizer (Gemini integration)
- Adding password-based login/register endpoints
- Database migration from Neon to other provider

---

## 9. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-05-04 | v1.0 | Kilo | Initial spec based on comprehensive backend code review | — | All |
