# SPEC013 License Key Activation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> sdlc:subagent-driven-development (recommended) or sdlc:executing-plans to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for
> tracking.

**Goal:** Build a license key generation and activation system for PRO subscriptions.

**Architecture:** A new `LicenseKey` model tracks generated keys. The `User` model is updated with `subscription_expires_at`. The backend exposes APIs to generate keys (Admin only) and activate keys. The frontend provides a Magic Link `/activate?code=XYZ` flow and an Admin Dashboard `/admin/licenses`.

**Tech Stack:** FastAPI, SQLAlchemy, Alembic, Next.js, TailwindCSS.

---

## Task 1: Update Database Models & Migration

**Files:** 
- `backend/app/models/license.py`
- `backend/app/models/__init__.py`
- `backend/app/models/user.py`

**Steps:**
- [ ] **[RED]** Create `backend/tests/test_license_model.py` with a failing test that attempts to create a `LicenseKey` and assert `User.subscription_expires_at` exists.
- [ ] **[GREEN]** Update `backend/app/models/user.py` to add `subscription_expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)`.
- [ ] **[GREEN]** Create `backend/app/models/license.py` with `LicenseKey` model (fields: id, code, duration_days, tier, is_used, used_by_id, used_at, created_at, created_by_id).
- [ ] **[GREEN]** Import `LicenseKey` in `backend/app/models/__init__.py`.
- [ ] **[REFACTOR]** Run Alembic revision to auto-generate migration script: `alembic revision --autogenerate -m "Add LicenseKey and user subscription expiry"` and run `alembic upgrade head`. Verify tests pass.

## Task 2: Implement LicenseService (Backend)

**Files:**
- `backend/app/schemas/license.py`
- `backend/app/services/license_service.py`
- `backend/tests/test_license_service.py`

**Steps:**
- [ ] **[RED]** Write `test_license_service.py` testing `generate_keys` (requires admin) and `activate_key`.
- [ ] **[GREEN]** Create `backend/app/schemas/license.py` defining Pydantic models: `LicenseGenerateRequest`, `LicenseActivateRequest`, `LicenseResponse`.
- [ ] **[GREEN]** Create `backend/app/services/license_service.py`. Implement `generate_keys` (creates X random keys using `secrets.token_urlsafe(8)`).
- [ ] **[GREEN]** Implement `activate_key` in `LicenseService`. Check if code exists & `not is_used`. Update `is_used=True`, update `User.subscription_tier`, calculate new `subscription_expires_at` (extend existing or set `utcnow() + duration`).
- [ ] **[REFACTOR]** Ensure tests pass cleanly.

## Task 3: Implement License APIs (Backend)

**Files:**
- `backend/app/api/license.py`
- `backend/app/main.py`
- `backend/tests/test_license_api.py`

**Steps:**
- [ ] **[RED]** Write `test_license_api.py` to test `/api/admin/licenses/generate` (403 if not admin, 200 if admin) and `/api/subscriptions/activate` (200 success).
- [ ] **[GREEN]** Create `backend/app/api/license.py`. Define router.
- [ ] **[GREEN]** Add `POST /admin/licenses/generate` (requires `user.is_admin == True`).
- [ ] **[GREEN]** Add `GET /admin/licenses` (requires admin).
- [ ] **[GREEN]** Add `POST /subscriptions/activate` (requires authenticated user).
- [ ] **[GREEN]** Register `license_router` in `backend/app/main.py`.
- [ ] **[REFACTOR]** Ensure tests pass.

## Task 4: Frontend - Magic Link Activation Page

**Files:**
- `frontend/src/features/subscription/api/subscription-api.ts`
- `frontend/src/app/activate/page.tsx`

**Steps:**
- [ ] **[GREEN]** Create `subscription-api.ts` with `activateSubscriptionCode(code: string)` calling `POST /api/subscriptions/activate`.
- [ ] **[GREEN]** Create `/activate/page.tsx`.
- [ ] **[GREEN]** In `page.tsx`, read `searchParams.get('code')`. 
- [ ] **[GREEN]** Use `useEffect` to check Auth. If not logged in, save code to `sessionStorage` and redirect to `/login`.
- [ ] **[GREEN]** If logged in, call `activateSubscriptionCode`. Show Success UI (Neo-brutalism style) with "Tài khoản của bạn đã được nâng cấp!" and a button to go to Dashboard.
- [ ] **[REFACTOR]** Handle errors (400 Invalid/Used code) gracefully on UI.

## Task 5: Frontend - Admin Dashboard for Licenses

**Files:**
- `frontend/src/features/subscription/api/admin-license-api.ts`
- `frontend/src/app/admin/licenses/page.tsx`

**Steps:**
- [ ] **[GREEN]** Create `admin-license-api.ts` with `generateLicenses(days, count, tier)` and `getLicenses()`.
- [ ] **[GREEN]** Create `/admin/licenses/page.tsx`.
- [ ] **[GREEN]** Check Auth and Admin status. If not admin, redirect to `/dashboard` or show 403.
- [ ] **[GREEN]** Build UI: A form to Generate Codes (Dropdown for Duration: 1 Month / 1 Year, Input for Count).
- [ ] **[GREEN]** Build UI: A Table listing generated codes, showing `code` (with click-to-copy magic link), `duration`, `status` (Used/Unused), `used_by`, `created_at`.
- [ ] **[REFACTOR]** Ensure Neo-brutalism design consistency.

## Task 6: Frontend - Pricing Page Updates

**Files:**
- `frontend/src/app/pricing/page.tsx`

**Steps:**
- [ ] **[GREEN]** Update `frontend/src/app/pricing/page.tsx` (or create if it doesn't exist).
- [ ] **[GREEN]** Add Neo-brutalism pricing tiers (Free, Pro, Enterprise).
- [ ] **[GREEN]** Change the "Upgrade" button for PRO to open a Modal or show instructions: "Chuyển khoản VietQR với nội dung: TVB <Email>".
- [ ] **[GREEN]** Provide Admin Zalo/Fanpage contact info for support.

---
