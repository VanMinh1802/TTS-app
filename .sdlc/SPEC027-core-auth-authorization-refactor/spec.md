# Feature: Auth & Authorization Refactor

> **Status:** Draft
> **Author:** Kilo
> **Date:** 2026-05-06
> **Related Issues:** #12 issues from codebase audit

---

## 1. Problem Statement

### 1.1 User Problem

1. **Security**: Access token stored in localStorage exposed to XSS attacks. Open redirect vulnerability in login page allows phishing.
2. **UX**: Every page load shows "Đăng nhập" button briefly before switching to user menu (Flash of Unauthenticated Layout). Login page is a navigation dead end. After login users always land on /dashboard regardless of original target page.
3. **Navigation inconsistency**: Public routes `/pricing` and `/voices` are accessible but hidden from navigation when not logged in. Admin link "Quản trị Hệ thống" shows in dropdown for all users regardless of admin status.
4. **Inefficiency**: `/auth/me` API called up to 6 times on app load (useAuth + Dashboard + Admin + Settings + Library + Activate).
5. **No reusable authorization**: Each page implements role/tier checks ad-hoc with duplicated logic.

### 1.2 Business Impact

- XSS vulnerability could lead to account takeover for all users
- Open redirect vulnerability enables phishing attacks leveraging our domain
- Poor UX raises bounce rate and support inquiries
- Duplicate API calls waste bandwidth and increase server load

### 1.3 Success Criteria

- [ ] No access_token in localStorage — all auth via HttpOnly cookies only
- [ ] Callback URLs validated against local paths only
- [ ] Zero Flash of Unauthenticated Layout on page load
- [ ] `/auth/me` called exactly once per app load
- [ ] Public routes visible in navigation when not logged in
- [ ] Admin link conditionally rendered (only for is_admin users)
- [ ] All unit tests pass

---

## 2. User Stories & Acceptance Criteria

### Story 1: Secure Token Storage (CRITICAL)

**As a** security-conscious user,
**I want** my access token stored only in HttpOnly cookies,
**so that** XSS attacks cannot steal my session.

#### Acceptance Criteria

- **Given** a successful login, **When** the backend responds with access_token, **Then** the token is NOT written to localStorage
- **Given** an authenticated user, **When** any API call is made, **Then** the HttpOnly cookie is sent via `credentials: 'include'` (no Bearer header from localStorage)
- **Given** a page refresh, **When** the app determines auth state, **Then** it calls `GET /auth/me` with `credentials: 'include'` (not localStorage check)
- **Given** token refresh, **When** the backend returns a new access_token, **Then** it is set as HttpOnly cookie only, not localStorage

### Story 2: Safe Login Redirect (CRITICAL)

**As a** user,
**I want** login redirects to only go to application pages,
**so that** I cannot be tricked into visiting a malicious website after login.

#### Acceptance Criteria

- **Given** a valid callbackUrl starting with "/", **When** login completes, **Then** redirect to that path
- **Given** a callbackUrl of "https://evil.com", **When** login completes, **Then** redirect to /dashboard (safe default)
- **Given** no callbackUrl, **When** login completes, **Then** redirect to /dashboard
- **Given** an unauthenticated request to /studio, **When** middleware intercepts, **Then** redirect to /login?callbackUrl=/studio

### Story 3: Auth State Loading (HIGH)

**As a** returning user,
**I want** a smooth loading experience when the app checks my auth state,
**so that** I don't see a flash of the logged-out UI before my session is verified.

#### Acceptance Criteria

- **Given** the app is loading auth state (GET /auth/me in flight), **When** Navbar renders, **Then** show a skeleton placeholder (not "Đăng nhập" button)
- **Given** auth state resolves to authenticated, **When** loading completes, **Then** transition from skeleton to full user menu without visual flash
- **Given** auth state resolves to unauthenticated, **When** loading completes, **Then** transition from skeleton to public nav (Pricing, Voices, Đăng nhập)
- **Given** a protected page (e.g. /studio) is loading, **When** auth state is not yet determined, **Then** show a page-level skeleton, not the protected content

### Story 4: Public Route Navigation (MEDIUM)

**As a** visitor who hasn't logged in,
**I want** to see Pricing and Voices in the navigation bar,
**so that** I can explore these pages before deciding to sign up.

#### Acceptance Criteria

- **Given** a user is not logged in, **When** the Navbar renders, **Then** show links: Logo, Pricing, Voices, Đăng nhập
- **Given** a user is on /login, **When** the Navbar renders, **Then** show the same public nav (not hidden)
- **Given** a user is logged in, **When** the Navbar renders, **Then** show the full authenticated nav including Dashboard, Studio, etc.
- **Given** middleware configuration, **When** routing, **Then** `/pricing` and `/voices` remain accessible without auth

### Story 5: Role-Based Authorization Components (HIGH)

**As a** developer,
**I want** reusable components for authorization checks,
**so that** I can protect routes and UI sections consistently without duplicating logic.

#### Acceptance Criteria

- **Given** a user is not authenticated, **When** `<RequireAuth>` wraps content, **Then** redirect to /login?callbackUrl=<current_path> or render fallback
- **Given** a user lacks the required role, **When** `<RequireRole roles={['admin']}>` wraps content, **Then** render `<AccessDenied>` with lock icon and explanation
- **Given** a user's tier is below required, **When** `<RequireTier tiers={['pro', 'enterprise']}>` wraps content, **Then** render `<UpgradePrompt>` with link to /pricing

### Story 6: Admin Link Conditional Display (HIGH)

**As a** regular user,
**I want** the admin link hidden from my navigation menu,
**so that** I don't see UI elements I cannot use.

#### Acceptance Criteria

- **Given** a user with is_admin=false, **When** the user dropdown renders, **Then** no "Quản trị Hệ thống" link appears
- **Given** a user with is_admin=true, **When** the user dropdown renders, **Then** "Quản trị Hệ thống" link appears and navigates to /admin

### Story 7: Centralized Auth State (HIGH)

**As a** frontend component,
**I want** to access auth state (user profile, admin status, tier) from a single React Context,
**so that** I don't need to call GET /auth/me redundantly.

#### Acceptance Criteria

- **Given** the app mounts, **When** AuthProvider initializes, **Then** GET /auth/me is called exactly once
- **Given** AuthProvider has loaded user data, **When** any component calls useAuth(), **Then** it receives `{ status, user, login, logout }` with full AuthUser type (id, email, name, is_admin, subscription_tier)
- **Given** the access token is refreshed (via silent refresh), **When** refresh succeeds, **Then** AuthProvider re-fetches /auth/me (second call, total of 2 in refresh scenario)
- **Given** login/logout completes, **When** auth-state-changed event fires, **Then** AuthProvider refreshes its state

### Story 8: Cleanup & Error Handling (MEDIUM)

**As a** developer maintaining this code,
**I want** the auth code to be clean, debuggable, and error-resilient,
**so that** fixing session issues is straightforward.

#### Acceptance Criteria

- **Given** a logout action, **When** all cleanup runs, **Then** the cleanup is centralized in AuthProvider (not split between Navbar and auth-api)
- **Given** the `useSyncExternalStore` import in Navbar, **When** code is compiled, **Then** it is removed (unused)
- **Given** token refresh fails, **When** the error occurs, **Then** a descriptive error is logged to console (without exposing token data)
- **Given** a session expiry, **When** 401 is detected with failed refresh, **Then** user is redirected to /login with a clear notification

---

## 3. Functional Requirements

### 3.1 Core Behaviors

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Remove localStorage access_token storage; use HttpOnly cookies only | Must |
| FR-2 | Validate callbackUrl is a local path (starts with "/") before redirecting | Must |
| FR-3 | Middleware appends callbackUrl query param on /login redirect | Must |
| FR-4 | Create AuthProvider React Context with full AuthUser type | Must |
| FR-5 | AuthProvider shows loading skeleton during auth state determination | Must |
| FR-6 | Navbar shows public nav (Pricing, Voices, Đăng nhập) for unauthenticated users | Must |
| FR-7 | Navbar shows public nav on /login page (no longer hidden) | Must |
| FR-8 | Create `<RequireAuth>`, `<RequireRole>`, `<RequireTier>` components | Must |
| FR-9 | Create `<AccessDenied>` and `<UpgradePrompt>` UI components | Should |
| FR-10 | Admin link in user dropdown conditionally rendered (is_admin check) | Must |
| FR-11 | AuthProvider calls GET /auth/me exactly once on mount | Must |
| FR-12 | Centralize logout cleanup in AuthProvider | Must |
| FR-13 | Remove unused `useSyncExternalStore` import from Navbar | Must |
| FR-14 | Add console.error logging to token refresh failure path | Should |
| FR-15 | Replace ad-hoc getCurrentUser() calls in Dashboard, Admin, Settings, Library, Activate with useAuth() | Must |
| FR-16 | Wrap admin page content in `<RequireRole roles={['admin']}>` | Should |
| FR-17 | Wrap library pro features in `<RequireTier tiers={['pro', 'enterprise']}>` | Should |

### 3.2 Edge Cases

- Token expires between page load and first API call → api-client handles 401 + refresh
- Multiple tabs open, logout in one tab → `auth-state-changed` event syncs other tabs
- User directly navigates to /login while already authenticated → middleware redirects to /dashboard
- Google OAuth Client ID not configured → Login page shows configuration error
- Auth /me request fails with non-401 error (e.g., 500) → treated as unauthenticated gracefully
- Very fast login → callbackUrl redirect fires before AuthProvider finishes loading → fine, AuthProvider handles on destination page

### 3.3 Error Handling

| Scenario | Expected Behavior |
|----------|-------------------|
| GET /auth/me fails (network error) | AuthProvider: status='unauthenticated', no crash |
| GET /auth/me returns 401 | AuthProvider: status='unauthenticated' |
| POST /auth/refresh fails | api-client: log error, clear any stale state, redirect /login with notification |
| Login API returns error | Login page: show inline error, notify via toast |
| Access denied (403 on API call) | api-client: show notification, do NOT redirect |

---

## 4. Non-Functional Requirements

### 4.1 Performance

- AuthProvider loading time: < 500ms (GET /auth/me on localhost)
- No additional network requests on auth state change (events only)
- Skeleton UI renders in < 50ms while waiting for auth

### 4.2 Security

- Access token NEVER in localStorage — HttpOnly cookies only
- All API requests include `credentials: 'include'`
- CSRF token sent via X-CSRF-Token header for mutating requests (existing behavior preserved)
- Callback URLs validated: must start with "/" (local path only)
- No sensitive data in console logs

### 4.3 Constraints

- Platform: Next.js 16+ (App Router)
- Dependencies: `@react-oauth/google` (existing), React 19+
- Compatibility: Must work with existing backend `/auth/login/google`, `/auth/me`, `/auth/logout`, `/auth/refresh` endpoints
- Integration: Must maintain existing i18n (I18nProvider), notifications (NotificationProvider), theme (ThemeProvider)

---

## 5. Unit Test Cases (TDD)

> **TDD Required:** Every test case below must be implemented using RED-GREEN-REFACTOR cycle.

### 5.1 Test Case Registry

| ID | File | Description | Status |
|----|------|-------------|--------|
| TC-01 | `src/features/auth/__tests__/auth-provider.test.tsx` | AuthProvider renders loading skeleton when checking auth | RED |
| TC-02 | `src/features/auth/__tests__/auth-provider.test.tsx` | AuthProvider sets authenticated state on successful /auth/me | RED |
| TC-03 | `src/features/auth/__tests__/auth-provider.test.tsx` | AuthProvider sets unauthenticated state on failed /auth/me | RED |
| TC-04 | `src/features/auth/__tests__/auth-provider.test.tsx` | useAuth() exposes full AuthUser type (id, email, name, is_admin, subscription_tier) | RED |
| TC-05 | `src/features/auth/__tests__/auth-provider.test.tsx` | AuthProvider calls /auth/me exactly once on mount | RED |
| TC-06 | `src/features/auth/__tests__/require-auth.test.tsx` | RequireAuth renders children when authenticated | RED |
| TC-07 | `src/features/auth/__tests__/require-auth.test.tsx` | RequireAuth redirects to /login when unauthenticated | RED |
| TC-08 | `src/features/auth/__tests__/require-auth.test.tsx` | RequireAuth renders fallback when loading | RED |
| TC-09 | `src/features/auth/__tests__/require-role.test.tsx` | RequireRole renders children when user has required role | RED |
| TC-10 | `src/features/auth/__tests__/require-role.test.tsx` | RequireRole renders AccessDenied when user lacks role | RED |
| TC-11 | `src/features/auth/__tests__/require-tier.test.tsx` | RequireTier renders children when user tier matches | RED |
| TC-12 | `src/features/auth/__tests__/require-tier.test.tsx` | RequireTier renders UpgradePrompt when user tier is lower | RED |
| TC-13 | `src/features/auth/__tests__/auth-api.test.ts` | loginWithGoogle does NOT store token in localStorage | RED |
| TC-14 | `src/features/auth/__tests__/auth-api.test.ts` | logout clears auth state completely | RED |
| TC-15 | `src/lib/__tests__/api-client.test.ts` | api-client returns token from refresh on 401 | RED |
| TC-16 | `src/lib/__tests__/api-client.test.ts` | api-client redirects to /login when refresh also fails | RED |

### 5.2 Test Case Details

#### TC-01: AuthProvider renders loading skeleton when checking auth

**Given** AuthProvider is mounted,
**When** GET /auth/me is in flight,
**Then** useAuth() returns `{ status: 'loading', user: null }`

#### TC-02: AuthProvider sets authenticated state on successful /auth/me

**Given** GET /auth/me returns { id, email, name, is_admin, subscription_tier },
**When** the response resolves,
**Then** useAuth() returns `{ status: 'authenticated', user: { ...full profile } }`

#### TC-03: AuthProvider sets unauthenticated state on failed /auth/me

**Given** GET /auth/me returns 401,
**When** the response resolves,
**Then** useAuth() returns `{ status: 'unauthenticated', user: null }`

#### TC-04: useAuth() exposes full AuthUser type

**Given** an authenticated session,
**When** calling useAuth().user,
**Then** the object contains: id, email, name, is_admin (boolean), subscription_tier (string)

#### TC-05: AuthProvider calls /auth/me exactly once on mount

**Given** AuthProvider is mounted,
**When** multiple components call useAuth(),
**Then** GET /auth/me is fetched exactly 1 time (not once per consumer)

#### TC-06: RequireAuth renders children when authenticated

**Given** AuthContext has status='authenticated' with user,
**When** RequireAuth wraps a child component,
**Then** the child renders normally

#### TC-07: RequireAuth redirects to /login when unauthenticated

**Given** AuthContext has status='unauthenticated',
**When** RequireAuth mounts on a protected page,
**Then** user is redirected to /login?callbackUrl=<original_path>

#### TC-08: RequireAuth renders fallback when loading

**Given** AuthContext has status='loading',
**When** RequireAuth mounts,
**Then** children are NOT rendered, loading fallback or skeleton is shown

#### TC-09: RequireRole renders children when user has required role

**Given** user = { is_admin: true },
**When** `<RequireRole roles={['admin']}>` wraps content,
**Then** children render

#### TC-10: RequireRole renders AccessDenied when user lacks role

**Given** user = { is_admin: false },
**When** `<RequireRole roles={['admin']}>` wraps content,
**Then** AccessDenied component renders with lock icon

#### TC-11: RequireTier renders children when user tier matches

**Given** user = { subscription_tier: 'pro' },
**When** `<RequireTier tiers={['pro', 'enterprise']}>` wraps content,
**Then** children render

#### TC-12: RequireTier renders UpgradePrompt when user tier is lower

**Given** user = { subscription_tier: 'free' },
**When** `<RequireTier tiers={['pro', 'enterprise']}>` wraps content,
**Then** UpgradePrompt renders with link to /pricing

#### TC-13: loginWithGoogle does NOT store token in localStorage

**Given** a mock API response with access_token,
**When** loginWithGoogle completes,
**Then** localStorage.getItem("access_token") returns null

#### TC-14: logout clears auth state completely

**Given** AuthContext has status='authenticated',
**When** calling logout(),
**Then** AuthContext updates to status='unauthenticated' and user=null

#### TC-15: api-client returns token from refresh on 401

**Given** an API call returns 401,
**When** POST /auth/refresh returns a new access_token,
**Then** the original API call is retried and returns data

#### TC-16: api-client redirects to /login when refresh also fails

**Given** an API call returns 401,
**When** POST /auth/refresh also fails,
**Then** user is redirected to /login with notification

---

## 6. Boundaries

### [ALLOW] Always Do

- Follow existing file structure conventions in `frontend/src/features/auth/`
- Run existing Playwright E2E tests after changes
- Use existing `notificationService` for user-facing messages
- Follow existing CSS patterns (aether-glass, Tailwind classes)

### [CAUTION] Ask First

- Adding new NPM dependencies
- Changing the proxy.ts middleware matcher pattern
- Modifying backend API contract

### [FORBID] Never Do

- Store access_token in localStorage
- Expose tokens or sensitive data in console.log
- Write production code before writing test first (TDD)
- Remove or break existing features (login, logout, Google OAuth)
- Change the middleware's HttpOnly cookie reading approach

---

## 7. Verification

### 7.1 Test Plan

| Requirement | Test Method | TDD Status |
|-------------|-------------|------------|
| FR-1 (no localStorage token) | TC-13 Unit | Pending (RED) |
| FR-2 (callbackUrl validation) | Manual + future unit | Pending |
| FR-3 (middleware callbackUrl) | E2E + Manual | Pending |
| FR-4 (AuthProvider Context) | TC-01, TC-02, TC-03, TC-04 Unit | Pending (RED) |
| FR-5 (loading skeleton) | TC-01, TC-08 Unit | Pending (RED) |
| FR-6 (public nav) | Manual + E2E | Pending |
| FR-7 (nav on /login) | Manual + E2E | Pending |
| FR-8 (RBAC components) | TC-06–TC-12 Unit | Pending (RED) |
| FR-10 (admin link conditional) | Manual | Pending |
| FR-11 (single /auth/me call) | TC-05 Unit | Pending (RED) |
| FR-12 (centralized logout) | TC-14 Unit | Pending (RED) |
| FR-14 (refresh error logging) | Manual | Pending |
| FR-15 (replace getCurrentUser calls) | Manual verification | Pending |
| FR-16 (RequireRole on admin) | TC-09, TC-10 Unit | Pending (RED) |
| FR-17 (RequireTier on library) | TC-11, TC-12 Unit | Pending (RED) |

### 7.2 Acceptance Checklist

- [ ] All user stories implemented
- [ ] All acceptance criteria met
- [ ] Edge cases handled
- [ ] All TDD test cases follow RED-GREEN-REFACTOR cycle
- [ ] Existing E2E tests still pass (landing page, login page, pricing, studio redirect)
- [ ] No boundary violations

---

## 8. Out of Scope

- Backend auth endpoint changes (POST /auth/refresh, POST /auth/login/google, etc.)
- Multi-factor authentication
- Passwordless login (non-Google)
- Session management dashboard or admin UI
- Rate limiting changes
- CSRF token setup changes (existing mechanism preserved as-is)
- Changes to the IndexedDB token extraction helper (getCurrentUserId) - will update it to use useAuth() instead of localStorage

---

## 9. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-05-06 | v1.0 | Kilo | Initial spec | — | All |
