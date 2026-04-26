# Core Enhanced TTS Application Partial Completion Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `sdlc:subagent-driven-development` (recommended) or `sdlc:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện đúng phần backend và frontend còn partial theo thứ tự phụ thuộc, để app dùng live data thay vì placeholder mà vẫn giữ nguyên kiến trúc client-side TTS và phạm vi của SPEC001.

**Architecture:** Giữ mô hình FastAPI backend + Next.js frontend hiện tại. Backend chỉ làm orchestration cho auth, quota, analytics, R2, dictionary, voices, và rate limiting; frontend chỉ fetch dữ liệu live qua feature helpers typed và render state. Không chuyển sang server-side TTS, không mở rộng sang các module chưa nằm trong phạm vi partial hiện tại, và không thay đổi kiến trúc app rộng hơn mức cần để đóng các gap hiện hữu.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, Redis, Cloudflare R2, Next.js 16, React 19, TypeScript, Tailwind CSS, Framer Motion, `@playwright/test`.

---

> **Spec:** `.sdlc/SPEC001-core-enhanced-tts-application/spec.md`
> **Status:** Draft
> **Author:** OpenCode
> **Date:** 2026-04-21

---

## 1. Architecture Overview

### 1.1 System Context

- Backend already contains the core orchestration modules: auth, quota, rate limiting, analytics, TTS, voices, dictionary, license, library, projects.
- Frontend already contains the main product surfaces: login, dashboard, studio, library, voices, API keys, activate, and project pages.
- The main gaps are correctness, consistency, and live-data wiring rather than entire missing subsystems.

### 1.2 Dependency Order

1. Backend correctness and safety: quota, analytics, rate limiting, R2 delivery.
2. Auth and user-facing account flows: login/session sync, API keys, dashboard data.
3. Dictionary persistence and normalization.
4. Voice list consistency and preview playback.
5. Project workflow stability around existing CRUD/export flows.
6. Error-code, docs, and perf cleanups limited to the surfaces above.

### 1.3 Component Interaction

```text
Browser page/component
  -> feature API helper
  -> FastAPI router
  -> service / repository
  -> PostgreSQL / Redis / R2
```

Frontend must not duplicate business rules such as quota math, dictionary conflict handling, or auth derivation. Those rules belong in the backend/service layer so the UI remains a thin consumer.

---

## 2. Tech Stack & Dependencies

| Category | Choice | Version | Rationale |
|----------|--------|---------|-----------|
| Backend framework | FastAPI | existing | Keep current API surface |
| Backend ORM | SQLAlchemy | existing | Matches current models/Alembic |
| Backend migrations | Alembic | existing | Needed for persistence and drift control |
| Cache / rate limit | Redis | existing | Required for rate limiting |
| Storage | Cloudflare R2 | existing | Used for model URLs / asset delivery |
| Frontend framework | Next.js App Router | existing | Keep current page/component structure |
| Frontend testing | `@playwright/test` | new | Browser smoke tests for live flows |

### 2.1 New Dependencies

- `@playwright/test`: smoke tests for login, dashboard, API keys, Studio, voices, and project flows.

### 2.2 Existing Modules Used

- `backend/app/services/quota_service.py`
- `backend/app/services/rate_limiter.py`
- `backend/app/services/analytics_service.py`
- `backend/app/services/r2_service.py`
- `backend/app/services/voice_registry.py`
- `backend/app/services/project_service.py`
- `frontend/src/app/*`
- `frontend/src/components/*`
- `frontend/src/features/*`

---

## 3. Data Model

### 3.1 Tables Reused

| Table | Purpose |
|------|---------|
| `users` | auth and admin flags |
| `api_keys` | developer access keys |
| `user_quotas` | quota tracking |
| `usage_history` | quota history snapshots |
| `request_logs` | analytics |
| `usage_snapshots` | usage by feature/day |
| `projects`, `scenes`, `segments`, `project_export_jobs` | current project workflow |

### 3.2 New Table

**`dictionary_entries`**

| Column | Type | Nullable | Index | Notes |
|--------|------|----------|-------|-------|
| `id` | string(36) | No | PK | stable id |
| `user_id` | string(36) | No | Yes | owner |
| `word` | string(100) | No | Yes | source term |
| `pronunciation` | string(200) | No |  | replacement pronunciation |
| `priority` | integer | No | Yes | canonical ordering |
| `category` | string(50) | Yes |  | optional metadata |
| `created_at` | datetime | No |  | audit |
| `updated_at` | datetime | No |  | audit |

### 3.3 Schema Adjustment

Quota limits must support unlimited values with `null` rather than forcing subtraction on a sentinel number.

---

## 4. API Contracts

### 4.1 Quota / Analytics

- `GET /api/quota`
- `GET /api/admin/analytics`

### 4.2 Auth / API Keys

- `POST /api/auth/google`
- `GET /api/auth/keys`
- `POST /api/auth/keys`
- `DELETE /api/auth/keys/{key_id}`
- `GET /api/auth/keys/{key_id}/usage`

### 4.3 Dictionary / Normalization

- `GET /api/dictionary`
- `POST /api/dictionary`
- `PUT /api/dictionary/{entry_id}`
- `DELETE /api/dictionary/{entry_id}`
- `POST /api/dictionary/import`
- `GET /api/dictionary/export`
- `GET /api/dictionary/search`
- `POST /api/tts/normalize`

### 4.4 Voice List / Playback

- `GET /api/voices`
- `GET /api/tts/voices`
- `POST /api/tts/preview` only if the current voice/sample architecture cannot satisfy preview playback through existing sample URLs or generation endpoints

### 4.5 Projects

- `/api/projects` and export-related subroutes remain the source of truth for the existing project workflow only.

---

## 5. Internal Service Design

### 5.1 Backend Interfaces

```python
class QuotaService:
    def get_quota_status(self, user_id: str) -> dict: ...
    def check_quota(self, user_id: str, resource: str, amount: int = 1) -> bool: ...
    def get_remaining(self, quota: UserQuota) -> dict: ...


class DictionaryRepository:
    def list_entries(self, user_id: str) -> list[DictionaryEntryRecord]: ...
    def create_entry(self, user_id: str, payload: DictionaryCreate) -> DictionaryEntryRecord: ...
    def update_entry(self, user_id: str, entry_id: str, payload: DictionaryUpdate) -> DictionaryEntryRecord: ...
    def delete_entry(self, user_id: str, entry_id: str) -> bool: ...


async def rate_limit_middleware(request, call_next) -> Response: ...
```

### 5.2 Frontend Helpers

```ts
type QuotaLimit = number | null;

interface DashboardSummary {
  quota: QuotaStatus;
  analytics: AnalyticsSummary;
}

interface VoicePreviewResult {
  voice_id: string;
  audio_url: string;
  duration: number;
}

interface DictionaryEntry {
  id: string;
  word: string;
  pronunciation: string;
  priority: number;
  category?: string | null;
}
```

The page components should only consume these helpers and render state. They should not duplicate API URL building, auth token storage, response-shape conversion logic, or business rules.

---

## 6. Constraints & Trade-offs

### 6.1 Constraints

- Keep client-side TTS generation intact.
- Do not introduce React Query yet; thin feature helpers are enough for this pass.
- Keep the current brutal visual language and English UI text.
- Use `PYTHONPATH=backend` when running backend tests in this repo.
- Do not expand into new product surfaces beyond the partials listed in this plan.

### 6.2 Trade-offs

| Decision | Alternative | Why this choice |
|----------|-------------|-----------------|
| Page-level fetch helpers | Full React Query rewrite | Smaller blast radius while partials are still being closed |
| Playwright smoke tests | No frontend tests | These partials are user flows, so browser coverage gives the best signal |
| DB-backed dictionary | Keep in-memory store | The current in-memory approach is the reason the feature is still partial |

### 6.3 Explicit Non-Goals

- shadcn/ui migration.
- IndexedDB model caching.
- ONNX Runtime Web Worker.
- SSML parser and code-switching.
- Domain presets.
- Custom voice presets.
- TypeScript SDK and integration guides.
- Subscription system overhaul.
- Admin dashboard rebuild beyond current live analytics visibility.
- Cloud sync for projects.
- PWA offline mode.
- Collaboration, version history, templates, and timeline expansion beyond stabilizing the current project workflow.

---

## 7. Traceability Matrix

| Spec Area | Covered By Tasks |
|-----------|------------------|
| Core architecture: auth/quota/rate limit/R2 | Task 1, Task 2, Task 7 |
| Developer experience: API keys, dashboard, live flows | Task 3, Task 7 |
| Dictionary management | Task 4 |
| Voice library and preview | Task 5 |
| Existing project workflow stability | Task 6 |
| Non-functional consistency, docs, and error codes | Task 7 |

---

## 8. Implementation Tasks

### Task 1: Quota And Analytics Hardening

**Files:** `backend/app/services/quota_service.py`, `backend/app/schemas/quota.py`, `backend/app/middleware/logging.py`, `backend/app/services/analytics_service.py`, `backend/tests/test_quota.py`, `backend/tests/test_analytics.py`

- **[RED]** Add failing tests for unlimited-tier quota math, `QuotaStatusResponse` serialization with `null` limits, and request log persistence from middleware.
- **[GREEN]** Update the quota service to treat `None` as unlimited, update the response schema to allow nullable limits, and make logging use a request-scoped session that is always closed.
- **[REFACTOR]** Extract repeated quota math into helpers and move request-metadata normalization into a shared path.
- **Verify:** `set PYTHONPATH=backend; pytest backend/tests/test_quota.py backend/tests/test_analytics.py -q`
- **Expected:** quota works for bounded and unlimited tiers, and analytics logging still inserts rows without leaking sessions.

### Task 2: Redis Rate Limiting And R2 Delivery

**Files:** `backend/app/services/rate_limiter.py`, `backend/app/main.py`, `backend/app/core/settings.py`, `backend/app/services/r2_service.py`, `backend/app/api/models.py`, `backend/tests/test_rate_limit.py`, `backend/tests/test_models.py`, `backend/tests/test_voice_registry.py`

- **[RED]** Add failing tests for a limited request that returns `429` with `X-RateLimit-*` headers and for stable R2 URL construction using the configured public base URL.
- **[GREEN]** Wire the rate limit logic into request handling at the edge, keep health/static exclusions intact, and make R2 client/base URLs come from one settings-backed source.
- **[REFACTOR]** Remove duplicated URL assembly and keep the rate-limit identifier and header builder in one place.
- **Verify:** `set PYTHONPATH=backend; pytest backend/tests/test_rate_limit.py backend/tests/test_models.py backend/tests/test_voice_registry.py -q`
- **Expected:** rate-limited routes return the correct headers, and R2 model download/upload URLs remain consistent.

### Task 3: Live Auth, API Keys, And Dashboard

**Files:** `frontend/src/features/auth/lib/token-store.ts` (new), `frontend/src/features/auth/api/auth-api.ts` (new), `frontend/src/features/auth/types/auth-types.ts` (new), `frontend/src/features/dashboard/api/dashboard-api.ts` (new), `frontend/src/features/dashboard/types/dashboard-types.ts` (new), `frontend/src/app/login/page.tsx`, `frontend/src/components/layout/Navbar.tsx`, `frontend/src/app/dashboard/page.tsx`, `frontend/src/app/api-keys/page.tsx`, `frontend/playwright.config.ts` (new), `frontend/e2e/auth-dashboard-api-keys.spec.ts` (new)

- **[RED]** Add a browser smoke test that fails with the current static dashboard/API key pages and stale login state.
- **[GREEN]** Replace hardcoded dashboard/API key data with live fetches, centralize token read/write logic in one helper, and return the user to `callbackUrl` after Google login.
- **[REFACTOR]** Split fetch helpers from pages so the page files only render loading/error/content states.
- **Verify:** `npm run lint`, `npm run build`, `npx playwright test frontend/e2e/auth-dashboard-api-keys.spec.ts`
- **Expected:** dashboard shows live quota/analytics, API keys list/create/revoke works, and sign-in returns to the requested route.

### Task 4: Persistent Dictionary And Text Normalization

**Files:** `backend/app/models/dictionary.py`, `backend/app/schemas/dictionary.py`, `backend/app/api/dictionary.py`, `backend/app/services/dictionary_service.py`, `backend/app/services/llm_normalizer.py`, `backend/alembic/versions/<timestamp>_dictionary_entries.py` (new), `backend/tests/test_dictionary_api.py` (new), `frontend/src/features/dictionary/api/dictionary-api.ts` (new), `frontend/src/features/dictionary/types/dictionary-types.ts` (new), `frontend/src/components/studio/CustomDictionary.tsx`, `frontend/src/app/studio/page.tsx`, `frontend/e2e/studio-dictionary.spec.ts` (new)

- **[RED]** Add failing tests for persistent dictionary CRUD, duplicate-word rejection, import/export, search behavior, and Studio loading saved entries.
- **[GREEN]** Replace the in-memory dictionary store with a DB-backed repository, make `priority` the canonical sort field, and wire Studio to load/save entries through the API before generating speech.
- **[REFACTOR]** Share the dictionary shapes between backend schemas, TTS payloads, and Studio components so the UI and API stop drifting apart.
- **Verify:** `alembic upgrade head`, `set PYTHONPATH=backend; pytest backend/tests/test_dictionary_api.py -q`, `npm run lint`, `npx playwright test frontend/e2e/studio-dictionary.spec.ts`
- **Expected:** dictionary entries persist across reloads and the Studio uses saved pronunciations.

### Task 5: Voice List Consistency And Playback

**Files:** `backend/app/schemas/tts.py`, `backend/app/api/tts.py`, `backend/app/services/tts_service.py`, `backend/tests/test_tts_voices_api.py`, `backend/tests/test_voices_api.py`, `frontend/src/features/voice/api/voice-api.ts`, `frontend/src/features/voice/types/voice-types.ts`, `frontend/src/components/studio/VoiceSelector.tsx`, `frontend/src/components/studio/AudioPreview.tsx`, `frontend/src/app/voices/page.tsx`, `frontend/src/app/studio/page.tsx`, `frontend/e2e/studio-voice-preview.spec.ts` (new)

- **[RED]** Add a failing smoke test for voice selection using live metadata and for playback of a selected voice sample.
- **[GREEN]** Add or reuse the smallest possible helper for sample playback, then have Studio and Voices pages reuse the same voice API wrapper.
- **[REFACTOR]** Move voice sorting and metadata formatting into the shared voice helper so Studio, Voices, and the current project voice selectors render the same names.
- **Verify:** `set PYTHONPATH=backend; pytest backend/tests/test_tts_voices_api.py backend/tests/test_voices_api.py -q`, `npm run lint`, `npx playwright test frontend/e2e/studio-voice-preview.spec.ts`
- **Expected:** preview/sample audio plays for the selected voice and hardcoded fallback voice behavior is removed or reduced to an explicit error fallback only.

### Task 6: Existing Project Workflow Stability

**Files:** `frontend/src/features/projects/api/projects-api.ts`, `frontend/src/app/projects/page.tsx`, `frontend/src/app/project/[id]/page.tsx`, `frontend/src/components/project/SceneSidebar.tsx`, `frontend/src/components/project/SegmentEditor.tsx`, `frontend/src/components/project/Timeline.tsx`, `frontend/src/components/project/ExportModal.tsx`, `backend/app/api/projects.py`, `backend/app/services/project_service.py`, `backend/tests/test_projects_api.py`, `backend/tests/test_project_service.py`, `frontend/e2e/project-workflow.spec.ts` (new)

- **[RED]** Add a smoke spec that fails when the editor still uses a static voice list, loses selection state, or export polling stops updating.
- **[GREEN]** Swap the static segment voice list for the shared live voice helper, keep project CRUD/export wired to the existing API, and preserve selection state while editing and exporting.
- **[REFACTOR]** Remove duplicated project sorting/mapping logic from the page layer where the component layer already owns it.
- **Verify:** `set PYTHONPATH=backend; pytest backend/tests/test_projects_api.py backend/tests/test_project_service.py -q`, `npm run lint`, `npm run build`, `npx playwright test frontend/e2e/project-workflow.spec.ts`
- **Expected:** existing project CRUD, segment editing, reordering, and export remain stable after the voice/data refactor.

### Task 7: OpenAPI, Error Codes, And Final Cleanup

**Files:** `backend/app/api/auth.py`, `backend/app/api/quota.py`, `backend/app/api/analytics.py`, `backend/app/api/models.py`, `backend/app/api/projects.py`, `backend/app/api/tts.py`, `backend/app/api/voices.py`, `backend/app/api/dictionary.py`, `backend/app/api/normalize.py`, `backend/app/core/exceptions.py`, `frontend/src/app/dashboard/page.tsx`, `frontend/src/app/api-keys/page.tsx`, `frontend/src/app/projects/page.tsx`, `frontend/src/app/project/[id]/page.tsx`, `frontend/src/app/studio/page.tsx`

- **[RED]** Add tests that assert representative error payloads, admin-only access control, and that the final live pages still render after the preceding refactors.
- **[GREEN]** Add route summaries/examples and normalize error codes/messages across the backend routers, then trim any remaining frontend rerenders or placeholder copy that no longer belongs.
- **[REFACTOR]** Consolidate shared error formatting and remove duplicated fetch state.
- **Verify:** `set PYTHONPATH=backend; pytest backend/tests/test_auth.py backend/tests/test_quota.py backend/tests/test_api_keys.py backend/tests/test_analytics.py backend/tests/test_projects_api.py -q`, `npm run lint`, `npm run build`
- **Expected:** documented endpoints, consistent error codes, admin access remains protected, and build/lint pass after the partials are closed.

---

## 9. Acceptance Coverage Checklist

- [ ] Client-side TTS remains client-side and is not replaced by a server-side generation path.
- [ ] Quota math handles bounded and unlimited tiers correctly.
- [ ] Rate limiting does not collide when multiple requests happen in the same second.
- [ ] Auth/session/token handling is consistent across login, navbar, API helpers, and logout.
- [ ] API keys and dashboard use live data, not placeholders.
- [ ] Dictionary entries persist, deduplicate correctly, and load into Studio.
- [ ] Voice lists and playback use live metadata and shared helpers.
- [ ] Existing project CRUD/export flows remain stable after refactors.
- [ ] Admin-only analytics remains protected by authorization.
- [ ] Error responses are consistent enough for frontend handling and documentation.

---

## 10. Constraints & Trade-offs

- Keep the client-side TTS model intact. Do not turn this into a server-side generation rewrite.
- Avoid a React Query migration until the partial surfaces are stable.
- Use browser smoke tests for the live flows because the frontend currently has no dedicated unit-test harness.
- Only add the dictionary migration; do not create new schema work for the other partials unless verification exposes drift.
- Do not broaden the plan into collaboration/version history/templates, SSML, code-switching, IndexedDB cache, or PWA work.

### Follow-ups

The following spec items remain out of scope for this plan and should be handled later:

- F2.2 shadcn/ui.
- F2.6 IndexedDB model caching.
- F2.7 ONNX Runtime Web Worker.
- F3.2 SSML parser.
- F3.3 Domain preset system.
- F3.5 Multi-language code-switching.
- F4.4 Custom voice presets.
- F5.3 Scene/segment editor expansion.
- F5.4 Timeline interface upgrades.
- F5.5 Export functionality expansion.
- F6.2 TypeScript SDK package.
- F6.4 Integration guides.
- F7.1 Subscription system.
- F7.2 Admin dashboard rebuild.
- F7.4 Cloud sync for projects.
- F8.1 PWA offline capability.

---

## 11. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-04-21 | v1.0 | OpenCode | Initial plan for completing partial items in dependency order | Establish the implementation path before touching code | All |
| 2026-04-26 | v1.1 | OpenCode | Tightened plan/spec alignment, added traceability, clarified task scope and verification | Make plan more executable and easier to review against spec | 1-11 |
