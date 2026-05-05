# Auth & Authorization Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> sdlc:subagent-driven-development (recommended) or sdlc:executing-plans to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for
> tracking.

**Goal:** Refactor frontend auth system to use HttpOnly cookies, React Context for centralized state, reusable RBAC components, fixed navigation, and eliminated duplicate /auth/me calls.

**Architecture:** React Context-based AuthProvider wrapping the app, calling GET /auth/me once on mount. All API calls use `credentials: 'include'` with HttpOnly cookies. RBAC via `<RequireAuth>`, `<RequireRole>`, `<RequireTier>` components. Navbar shows skeleton during loading, public nav when unauthenticated, full nav + conditional admin link when authenticated.

**Tech Stack:** React 19, Next.js 16 (App Router), Vitest + jsdom, @react-oauth/google (existing), framer-motion (existing)

---

> **Spec:** `.sdlc/SPEC027-core-auth-authorization-refactor/spec.md`
> **Status:** Draft
> **Author:** Kilo
> **Date:** 2026-05-06

---

## 1. Architecture Overview

### 1.1 System Context

The auth system sits as a cross-cutting concern in the frontend. Currently, auth state is derived from localStorage token reads scattered across components. The refactor centralizes state into a React Context provider that calls `/auth/me` exactly once, then distributes the full `AuthUser` profile to all components via `useAuth()`.

### 1.2 Component Interaction

```
Google OAuth Popup
       ↓
  loginWithGoogle() → POST /auth/login/google (credentials: 'include')
       ↓                Server sets HttpOnly cookie 'access_token'
  AuthProvider.notify() → GET /auth/me (credentials: 'include')
       ↓
  AuthContext state updated → { status: 'authenticated', user }
       ↓
  All consumers via useAuth() → Navbar, RequireAuth, RequireRole, RequireTier, Dashboard, etc.

API Calls → api-client (credentials: 'include')
  On 401 → POST /auth/refresh (credentials: 'include', sends HttpOnly refresh_token)
          → Server sets new HttpOnly 'access_token' cookie
          → AuthProvider re-fetches /auth/me
          → Retry original request
```

### 1.3 File Map

```
src/features/auth/
├── types.ts                     [NEW] AuthUser, AuthContextType, UserRole
├── components/
│   ├── AuthProvider.tsx          [NEW] React Context provider + skeleton
│   ├── RequireAuth.tsx           [NEW]
│   ├── RequireRole.tsx           [NEW]
│   ├── RequireTier.tsx           [NEW]
│   ├── AccessDenied.tsx          [NEW]
│   └── UpgradePrompt.tsx         [NEW]
├── hooks/
│   └── useAuth.ts               [NEW] context consumer hook
├── api/
│   └── auth-api.ts              [MODIFY] remove localStorage write
├── lib/
│   └── token-store.ts           [KEEP] custom events
└── __tests__/
    ├── auth-provider.test.tsx    [NEW]
    ├── require-auth.test.tsx     [NEW]
    ├── require-role.test.tsx     [NEW]
    ├── require-tier.test.tsx     [NEW]
    └── auth-api.test.ts         [NEW]

src/components/layout/
├── Navbar.tsx                    [MODIFY] skeleton, public nav, admin link
├── DesktopNav.tsx                [MODIFY] public items for unauthenticated
├── MobileNav.tsx                 [MODIFY] public items for unauthenticated
└── SkeletonNavbar.tsx            [NEW]

src/components/providers/
└── AppProviders.tsx              [MODIFY] add AuthProvider

src/lib/
└── api-client.ts                 [MODIFY] remove localStorage read, add console.error

src/app/login/
└── page.tsx                      [MODIFY] validate callbackUrl

src/proxy.ts                      [MODIFY] append callbackUrl param

src/app/
├── dashboard/page.tsx            [MODIFY] replace getCurrentUser with useAuth
├── admin/page.tsx                [MODIFY] use RequireRole
├── settings/page.tsx             [MODIFY] replace getCurrentUser with useAuth
└── activate/page.tsx             [MODIFY] replace getCurrentUser with useAuth

src/features/library/
├── components/LibraryPage.tsx    [MODIFY] replace getCurrentUser with useAuth
└── lib/indexed-db.ts             [MODIFY] replace localStorage with auth context

e2e/
└── navigation.spec.ts            [MODIFY] update tests
```

---

## 2. Tech Stack & Dependencies

| Category | Choice | Version | Rationale |
|----------|--------|---------|-----------|
| Framework | Next.js | 16.2.4 | Existing |
| UI | React | 19.2.4 | Existing |
| Testing | Vitest | 4.1.5 | Existing, jsdom for DOM |
| Auth | @react-oauth/google | 0.13.5 | Existing Google OAuth |
| Animation | framer-motion | 12.38.0 | Existing |

### 2.1 New Dependencies

None. All additions use existing dependencies.

### 2.2 Existing Modules Used (read-only)

- `@/shared/notifications/notification-store` — notificationService
- `@/shared/i18n` — I18nProvider
- `@/components/providers/ThemeProvider` — dark/light theme
- `@/features/auth/lib/token-store` — notifyAuthStateChanged event emitter

---

## 3. Data Model

### 3.1 AuthUser Type

```typescript
// src/features/auth/types.ts
export type UserRole = 'admin' | 'user';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  subscription_expires_at: string | null;
  subscription_activated_at: string | null;
  created_at: string | null;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextType {
  status: AuthStatus;
  user: AuthUser | null;
  login: () => void;
  logout: () => Promise<void>;
}
```

### 3.2 AuthProvider State Machine

```
   ┌─────────┐
   │ loading │ ← initial state, GET /auth/me in flight
   └────┬────┘
        │
   ┌────┴────────────┐
   │                 │
   ▼                 ▼
┌──────────────┐  ┌──────────────────┐
│ authenticated│  │ unauthenticated  │
└──────┬───────┘  └────────┬─────────┘
       │                   │
       │  logout()         │  login()
       ▼                   ▼
  ┌───────────┐     ┌───────────┐
  │unauthen...│     │authenti...│
  └───────────┘     └───────────┘

Any state ──auth-state-changed event──→ loading → re-check /auth/me → target state
```

---

## 4. API Contracts

All endpoints exist already — no backend changes required.

| Endpoint | Method | Auth | Response |
|----------|--------|------|----------|
| `/auth/login/google` | POST | Public (body: { credential }) | `{ access_token, token_type }` — also sets HttpOnly cookie |
| `/auth/me` | GET | Cookie | `CurrentUserResponse` (id, email, name, is_admin, subscription_tier, etc.) |
| `/auth/logout` | POST | Cookie | 204 — clears HttpOnly cookie |
| `/auth/refresh` | POST | Cookie (refresh_token) | `{ access_token }` — sets new access_token cookie |

---

## 5. Error Handling

| Scenario | Behavior |
|----------|----------|
| GET /auth/me returns 401 | AuthProvider: status='unauthenticated', user=null |
| GET /auth/me network error | AuthProvider: status='unauthenticated', user=null |
| POST /auth/refresh fails | api-client: console.error, clear stale state, redirect /login |
| Google OAuth popup closed/error | Login page: show inline error |
| loginWithGoogle API error | Login page: show error, notify toast |

---

## 6. Implementation Tasks

### Task 1: Create Auth types and AuthProvider

**Files:** `src/features/auth/types.ts` [NEW], `src/features/auth/components/AuthProvider.tsx` [NEW], `src/features/auth/__tests__/auth-provider.test.tsx` [NEW]

**Description:** Create the AuthUser type, AuthContextType, and AuthProvider React Context that calls GET /auth/me once on mount and distributes state to consumers. Covers TC-01, TC-02, TC-03, TC-04, TC-05.

---

**[RED]** Write failing test for TC-01, TC-02, TC-03, TC-05:

```typescript
// src/features/auth/__tests__/auth-provider.test.tsx
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/features/auth';

vi.mock('@/features/auth/api/auth-api', () => ({
  getCurrentUser: vi.fn(),
  loginWithGoogle: vi.fn(),
  logout: vi.fn(),
}));

import { getCurrentUser } from '@/features/auth/api/auth-api';

const mockUser = {
  id: 'usr_1',
  email: 'test@example.com',
  name: 'Test User',
  is_admin: false,
  subscription_tier: 'free' as const,
  subscription_expires_at: null,
  subscription_activated_at: null,
  created_at: null,
};

function TestConsumer({ onRender }: { onRender: (data: ReturnType<typeof useAuth>) => void }) {
  const auth = useAuth();
  onRender(auth);
  return null;
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('TC-01: AuthProvider renders loading state initially', async () => {
    vi.mocked(getCurrentUser).mockImplementation(() => new Promise(() => {}));

    const renders: ReturnType<typeof useAuth>[] = [];
    render(
      <AuthProvider>
        <TestConsumer onRender={(data) => renders.push(data)} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(renders[0].status).toBe('loading');
      expect(renders[0].user).toBeNull();
    });
  });

  test('TC-02: AuthProvider sets authenticated state on successful /auth/me', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);

    let lastRender: ReturnType<typeof useAuth> | null = null;
    render(
      <AuthProvider>
        <TestConsumer onRender={(data) => { lastRender = data; }} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(lastRender?.status).toBe('authenticated');
    });
    expect(lastRender?.user).toEqual(mockUser);
  });

  test('TC-03: AuthProvider sets unauthenticated state on failed /auth/me', async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('Unauthorized'));

    let lastRender: ReturnType<typeof useAuth> | null = null;
    render(
      <AuthProvider>
        <TestConsumer onRender={(data) => { lastRender = data; }} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(lastRender?.status).toBe('unauthenticated');
    });
    expect(lastRender?.user).toBeNull();
  });

  test('TC-05: AuthProvider calls /auth/me exactly once', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestConsumer onRender={() => {}} />
        <TestConsumer onRender={() => {}} />
        <TestConsumer onRender={() => {}} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getCurrentUser).toHaveBeenCalledTimes(1);
    });
  });
});
```

**[RED]** Run: `npx vitest run src/features/auth/__tests__/auth-provider.test.tsx`
**Expected:** FAIL — Cannot find module '@/features/auth' (AuthProvider, useAuth not exported yet)

**[GREEN]** Write types:

```typescript
// src/features/auth/types.ts
export type UserRole = 'admin' | 'user';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  subscription_expires_at: string | null;
  subscription_activated_at: string | null;
  created_at: string | null;
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextType {
  status: AuthStatus;
  user: AuthUser | null;
  login: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
}

export type { CurrentUserResponse } from '../api/auth-api';
```

**[GREEN]** Write AuthProvider:

```typescript
// src/features/auth/components/AuthProvider.tsx
'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getCurrentUser, loginWithGoogle, logout as apiLogout } from '../api/auth-api';
import type { AuthUser, AuthStatus, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  const checkAuth = useCallback(async () => {
    setStatus('loading');
    try {
      const u = await getCurrentUser();
      setUser(u as AuthUser);
      setStatus('authenticated');
    } catch {
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const handleAuthStateChanged = () => {
      checkAuth();
    };

    window.addEventListener('auth-state-changed', handleAuthStateChanged);
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthStateChanged);
    };
  }, [checkAuth]);

  const login = useCallback(async (credential: string) => {
    await loginWithGoogle(credential);
    await checkAuth();
  }, [checkAuth]);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  return (
    <AuthContext.Provider value={{ status, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
```

**[GREEN]** Create barrel export:

```typescript
// src/features/auth/index.ts
export { AuthProvider, useAuth } from './components/AuthProvider';
export { RequireAuth } from './components/RequireAuth';
export { RequireRole } from './components/RequireRole';
export { RequireTier } from './components/RequireTier';
export { AccessDenied } from './components/AccessDenied';
export { UpgradePrompt } from './components/UpgradePrompt';
export type { AuthUser, AuthStatus, AuthContextType, UserRole } from './types';
```

**[GREEN]** Run: `npx vitest run src/features/auth/__tests__/auth-provider.test.tsx`
**Expected:** All 4 tests PASS (TC-01, TC-02, TC-03, TC-05)

**[REFACTOR]** None needed — minimal implementation.

---

### Task 2: Refactor auth-api to remove localStorage and fix logout

**Files:** `src/features/auth/api/auth-api.ts` [MODIFY], `src/features/auth/__tests__/auth-api.test.ts` [NEW]

**Description:** Remove localStorage.setItem from loginWithGoogle, centralize logout cleanup. Covers TC-13, TC-14.

---

**[RED]** Write failing tests:

```typescript
// src/features/auth/__tests__/auth-api.test.ts
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api-client', () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from '@/lib/api-client';
import { loginWithGoogle, getCurrentUser, logout } from '../api/auth-api';

describe('auth-api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test('TC-13: loginWithGoogle does NOT store token in localStorage', async () => {
    const mockResponse = { access_token: 'eyJ...', token_type: 'bearer' };
    vi.mocked(apiRequest).mockResolvedValue(mockResponse);

    await loginWithGoogle('google-credential');

    expect(localStorage.getItem('access_token')).toBeNull();
  });

  test('TC-14: logout calls API and dispatches auth-state-changed', async () => {
    vi.mocked(apiRequest).mockResolvedValue(undefined);

    const dispatchSpy = vi.fn();
    window.addEventListener('auth-state-changed', dispatchSpy);

    await logout();

    expect(apiRequest).toHaveBeenCalledWith('/auth/logout', { method: 'POST', allowEmpty: true });
    expect(dispatchSpy).toHaveBeenCalled();
  });
});
```

**[RED]** Run: `npx vitest run src/features/auth/__tests__/auth-api.test.ts`
**Expected:** FAIL — TC-13: `localStorage.getItem('access_token')` still returns the token

**[GREEN]** Modify auth-api.ts:

```typescript
// src/features/auth/api/auth-api.ts
import { apiRequest } from "@/lib/api-client";
import { notifyAuthStateChanged } from "../lib/token-store";

export interface GoogleLoginResponse {
  access_token: string;
  token_type: string;
}

export interface CurrentUserResponse {
  id: string;
  email: string;
  name: string;
  subscription_tier: string;
  subscription_expires_at: string | null;
  subscription_activated_at: string | null;
  is_admin: boolean;
  created_at: string | null;
}

export const loginWithGoogle = async (credential: string): Promise<GoogleLoginResponse> => {
  const data = await apiRequest<GoogleLoginResponse>("/auth/login/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });

  notifyAuthStateChanged();
  return data;
};

export const getCurrentUser = async (): Promise<CurrentUserResponse> => {
  return apiRequest<CurrentUserResponse>("/auth/me");
};

export const logout = async (): Promise<void> => {
  await apiRequest("/auth/logout", { method: "POST", allowEmpty: true });
  notifyAuthStateChanged();
};
```

**[GREEN]** Run: `npx vitest run src/features/auth/__tests__/auth-api.test.ts`
**Expected:** Both tests PASS

---

### Task 3: Update api-client to remove localStorage token reading and add error logging

**Files:** `src/lib/api-client.ts` [MODIFY], `src/lib/__tests__/api-client.test.ts` [NEW]

**Description:** Remove localStorage.getItem('access_token') from buildHeaders, add console.error to tryRefreshToken failure path. Covers TC-15, TC-16.

---

**[RED]** Write failing tests:

```typescript
// src/lib/__tests__/api-client.test.ts
import { describe, test, expect, vi, beforeEach } from 'vitest';

vi.mock('@/shared/notifications/notification-store', () => ({
  notificationService: {
    notify: vi.fn(),
  },
}));

import { notificationService } from '@/shared/notifications/notification-store';
import { apiRequest, ApiError } from '../api-client';

describe('api-client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  test('TC-15: retries with refreshed token on 401', async () => {
    const successData = { result: 'ok' };

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access_token: 'new_token' }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => successData,
      } as unknown as Response);

    const result = await apiRequest('/test', { method: 'GET' });
    expect(result).toEqual(successData);
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  test('TC-16: redirects to /login when refresh fails', async () => {
    const originalLocation = window.location;
    delete (window as any).location;
    (window as any).location = { href: '', pathname: '/dashboard' };

    vi.mocked(global.fetch)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
      } as Response);

    await expect(apiRequest('/test', { method: 'GET' })).rejects.toThrow(ApiError);

    expect(notificationService.notify).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warning', source: 'auth' })
    );
    expect(window.location.href).toBe('/login');

    window.location = originalLocation;
  });
});
```

**[RED]** Run: `npx vitest run src/lib/__tests__/api-client.test.ts`
**Expected:** FAIL — TC-15 won't pass because buildHeaders still reads from localStorage

**[GREEN]** Modify api-client.ts buildHeaders:

```typescript
// src/lib/api-client.ts — change buildHeaders to NOT read localStorage
const buildHeaders = (headers: HeadersInit | undefined, hasJsonBody: boolean): Headers => {
  const requestHeaders = new Headers(headers);

  if (hasJsonBody && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  return requestHeaders;
};
```

Modify tryRefreshToken to add console.error:

```typescript
// src/lib/api-client.ts — in tryRefreshToken, replace the catch block
  } catch (err) {
    console.error('[Auth] Token refresh failed:', err instanceof Error ? err.message : 'Unknown error');
    return false;
  } finally {
```

**[GREEN]** Run: `npx vitest run src/lib/__tests__/api-client.test.ts`
**Expected:** Both tests PASS

---

### Task 4: Create RequireAuth component

**Files:** `src/features/auth/components/RequireAuth.tsx` [NEW], `src/features/auth/__tests__/require-auth.test.tsx` [NEW]

**Description:** Component that renders children only when authenticated, otherwise redirects to /login. Covers TC-06, TC-07, TC-08.

---

**[RED]** Write failing tests:

```typescript
// src/features/auth/__tests__/require-auth.test.tsx
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { RequireAuth } from '../components/RequireAuth';

const mockUseAuth = vi.fn();
vi.mock('@/features/auth', () => ({
  useAuth: () => mockUseAuth(),
  RequireAuth: (await vi.importActual('../components/RequireAuth')).RequireAuth,
}));

const mockRouter = { push: vi.fn() };
vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/test-page',
}));

describe('RequireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ status: 'loading', user: null });
  });

  test('TC-06: renders children when authenticated', () => {
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      user: { id: '1', email: 'a@b.com', name: 'A', is_admin: false, subscription_tier: 'free' },
    });
    const { getByText } = render(
      <RequireAuth><div>Protected Content</div></RequireAuth>
    );
    expect(getByText('Protected Content')).toBeDefined();
  });

  test('TC-07: redirects to /login when unauthenticated', () => {
    mockUseAuth.mockReturnValue({ status: 'unauthenticated', user: null });
    render(<RequireAuth><div>X</div></RequireAuth>);
    expect(mockRouter.push).toHaveBeenCalledWith('/login?callbackUrl=/test-page');
  });

  test('TC-08: renders loading fallback when status is loading', () => {
    mockUseAuth.mockReturnValue({ status: 'loading', user: null });
    const { container } = render(
      <RequireAuth loadingFallback={<div>Loading...</div>}><div>X</div></RequireAuth>
    );
    expect(container.textContent).toContain('Loading...');
  });
});
```

**[RED]** Run: `npx vitest run src/features/auth/__tests__/require-auth.test.tsx`
**Expected:** FAIL — RequireAuth not found

**[GREEN]** Write RequireAuth:

```typescript
// src/features/auth/components/RequireAuth.tsx
'use client';

import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface RequireAuthProps {
  children: ReactNode;
  loadingFallback?: ReactNode;
}

export function RequireAuth({ children, loadingFallback }: RequireAuthProps) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status === 'loading') {
    return loadingFallback ? <>{loadingFallback}</> : (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#6366F1] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return <>{children}</>;
}
```

**[GREEN]** Run: `npx vitest run src/features/auth/__tests__/require-auth.test.tsx`
**Expected:** All 3 tests PASS

---

### Task 5: Create RequireRole component + AccessDenied UI

**Files:** `src/features/auth/components/RequireRole.tsx` [NEW], `src/features/auth/components/AccessDenied.tsx` [NEW], `src/features/auth/__tests__/require-role.test.tsx` [NEW]

**Description:** Component that renders children only when user has required role. Covers TC-09, TC-10.

---

**[RED]** Write failing tests:

```typescript
// src/features/auth/__tests__/require-role.test.tsx
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

const mockUseAuth = vi.fn();
vi.mock('@/features/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

import { RequireRole } from '../components/RequireRole';

describe('RequireRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const adminUser = { id: '1', email: 'a@b.com', name: 'Admin', is_admin: true, subscription_tier: 'pro' };
  const regularUser = { id: '2', email: 'c@d.com', name: 'User', is_admin: false, subscription_tier: 'free' };

  test('TC-09: renders children when user has required role', () => {
    mockUseAuth.mockReturnValue({ status: 'authenticated', user: adminUser });
    const { getByText } = render(
      <RequireRole roles={['admin']}><div>Admin Panel</div></RequireRole>
    );
    expect(getByText('Admin Panel')).toBeDefined();
  });

  test('TC-10: renders AccessDenied when user lacks role', () => {
    mockUseAuth.mockReturnValue({ status: 'authenticated', user: regularUser });
    const { container } = render(
      <RequireRole roles={['admin']}><div>Admin Panel</div></RequireRole>
    );
    expect(container.textContent).toContain('Truy cập bị từ chối');
  });
});
```

**[RED]** Run: `npx vitest run src/features/auth/__tests__/require-role.test.tsx`
**Expected:** FAIL

**[GREEN]** Write AccessDenied:

```typescript
// src/features/auth/components/AccessDenied.tsx
export function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 font-light">
      <div className="aether-glass-wrapper rounded-[24px] max-w-md w-full border-red-500/20">
        <div className="aether-glass p-8 bg-red-950/10 text-center">
          <svg className="w-10 h-10 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <h2 className="text-[10px] font-medium uppercase tracking-[0.2em] text-red-400 mb-2">Truy cập bị từ chối</h2>
          <p className="font-light text-sm text-[#D4D4D8] leading-relaxed">
            Bạn không có đủ quyền để truy cập trang này.
          </p>
        </div>
      </div>
    </div>
  );
}
```

Write RequireRole:

```typescript
// src/features/auth/components/RequireRole.tsx
'use client';

import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { AccessDenied } from './AccessDenied';
import type { UserRole } from '../types';

interface RequireRoleProps {
  children: ReactNode;
  roles: UserRole[];
  fallback?: ReactNode;
}

export function RequireRole({ children, roles, fallback }: RequireRoleProps) {
  const { status, user } = useAuth();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#6366F1] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return fallback ?? <AccessDenied />;
  }

  const hasRole = roles.includes('admin') ? user.is_admin : true;

  if (!hasRole) {
    return fallback ?? <AccessDenied />;
  }

  return <>{children}</>;
}
```

**[GREEN]** Run: `npx vitest run src/features/auth/__tests__/require-role.test.tsx`
**Expected:** Both tests PASS

---

### Task 6: Create RequireTier component + UpgradePrompt UI

**Files:** `src/features/auth/components/RequireTier.tsx` [NEW], `src/features/auth/components/UpgradePrompt.tsx` [NEW], `src/features/auth/__tests__/require-tier.test.tsx` [NEW]

**Description:** Component that renders children only when user has required subscription tier. Covers TC-11, TC-12.

---

**[RED]** Write failing tests:

```typescript
// src/features/auth/__tests__/require-tier.test.tsx
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

const mockUseAuth = vi.fn();
vi.mock('@/features/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

import { RequireTier } from '../components/RequireTier';

describe('RequireTier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('TC-11: renders children when user tier matches', () => {
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      user: { id: '1', email: 'a@b.com', name: 'Pro', is_admin: false, subscription_tier: 'pro' },
    });
    const { getByText } = render(
      <RequireTier tiers={['pro', 'enterprise']}><div>Pro Feature</div></RequireTier>
    );
    expect(getByText('Pro Feature')).toBeDefined();
  });

  test('TC-12: renders UpgradePrompt when user tier is lower', () => {
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      user: { id: '2', email: 'c@d.com', name: 'Free', is_admin: false, subscription_tier: 'free' },
    });
    const { container } = render(
      <RequireTier tiers={['pro', 'enterprise']}><div>Pro Feature</div></RequireTier>
    );
    expect(container.textContent).toContain('nâng cấp');
  });
});
```

**[RED]** Run: `npx vitest run src/features/auth/__tests__/require-tier.test.tsx`
**Expected:** FAIL

**[GREEN]** Write UpgradePrompt:

```typescript
// src/features/auth/components/UpgradePrompt.tsx
import Link from 'next/link';

export function UpgradePrompt() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 font-light">
      <div className="aether-glass-wrapper rounded-[24px] max-w-md w-full border-[#C968F7]/20">
        <div className="aether-glass p-8 text-center">
          <svg className="w-10 h-10 text-[#C968F7] mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
          </svg>
          <h2 className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#C968F7] mb-2">Yêu cầu nâng cấp</h2>
          <p className="font-light text-sm text-[#D4D4D8] leading-relaxed mb-6">
            Tính năng này yêu cầu gói Pro hoặc Enterprise. Vui lòng nâng cấp tài khoản để tiếp tục.
          </p>
          <Link href="/pricing" className="aether-btn aether-btn-primary px-6 py-3 text-[10px] font-bold uppercase tracking-widest">
            Xem bảng giá
          </Link>
        </div>
      </div>
    </div>
  );
}
```

Write RequireTier:

```typescript
// src/features/auth/components/RequireTier.tsx
'use client';

import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { UpgradePrompt } from './UpgradePrompt';

type Tier = 'free' | 'pro' | 'enterprise';

interface RequireTierProps {
  children: ReactNode;
  tiers: Tier[];
  fallback?: ReactNode;
}

const tierHierarchy: Record<Tier, number> = {
  free: 0,
  pro: 1,
  enterprise: 2,
};

export function RequireTier({ children, tiers, fallback }: RequireTierProps) {
  const { status, user } = useAuth();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#6366F1] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return fallback ?? <UpgradePrompt />;
  }

  const userTier = user.subscription_tier as Tier;
  const userLevel = tierHierarchy[userTier] ?? 0;
  const requiredLevel = Math.min(...tiers.map(t => tierHierarchy[t] ?? 0));

  if (userLevel < requiredLevel) {
    return fallback ?? <UpgradePrompt />;
  }

  return <>{children}</>;
}
```

**[GREEN]** Run: `npx vitest run src/features/auth/__tests__/require-tier.test.tsx`
**Expected:** Both tests PASS

---

### Task 7: Update barrel export and delete old useAuth hook

**Files:** `src/features/auth/index.ts` [MODIFY], `src/components/layout/useAuth.ts` [DELETE]

**Description:** Ensure barrel export includes all new components. Delete the old useAuth hook.

---

```typescript
// src/features/auth/index.ts — verify it has all exports
export { AuthProvider, useAuth } from './components/AuthProvider';
export { RequireAuth } from './components/RequireAuth';
export { RequireRole } from './components/RequireRole';
export { RequireTier } from './components/RequireTier';
export { AccessDenied } from './components/AccessDenied';
export { UpgradePrompt } from './components/UpgradePrompt';
export type { AuthUser, AuthStatus, AuthContextType, UserRole } from './types';
```

Delete: `src/components/layout/useAuth.ts`

Update all imports from `@/components/layout/useAuth` to `@/features/auth`:
- `src/components/layout/Navbar.tsx` — change import
- `src/components/layout/DesktopNav.tsx` — change import
- `src/components/layout/MobileNav.tsx` — change import (if it imports useAuth directly)

Run: `npx vitest run` (all tests)
**Expected:** All existing tests still pass

---

### Task 8: Create SkeletonNavbar and refactor Navbar

**Files:** `src/components/layout/SkeletonNavbar.tsx` [NEW], `src/components/layout/Navbar.tsx` [MODIFY], `src/components/layout/DesktopNav.tsx` [MODIFY], `src/components/layout/MobileNav.tsx` [MODIFY]

**Description:** Show skeleton during auth loading, public nav for unauthenticated users, conditional admin link, show navbar on /login. Covers FR-5, FR-6, FR-7, FR-10.

---

Write SkeletonNavbar:

```typescript
// src/components/layout/SkeletonNavbar.tsx
'use client';

export function SkeletonNavbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#050508]/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/[0.06] animate-pulse" />
          <div className="w-24 h-4 rounded bg-white/[0.06] animate-pulse" />
        </div>
        <div className="hidden md:flex items-center gap-4">
          <div className="w-16 h-4 rounded bg-white/[0.06] animate-pulse" />
          <div className="w-12 h-4 rounded bg-white/[0.06] animate-pulse" />
          <div className="w-20 h-4 rounded bg-white/[0.06] animate-pulse" />
        </div>
        <div className="w-10 h-10 rounded-full bg-white/[0.06] animate-pulse" />
      </div>
    </nav>
  );
}
```

Modify Navbar.tsx:

```typescript
// src/components/layout/Navbar.tsx — key changes:

// 1. Change import:
import { useAuth } from "@/features/auth";

// 2. Replace token/user extraction:
const { status, user, logout } = useAuth();
const isLoggedIn = status === 'authenticated';

// 3. Show skeleton when loading:
if (status === 'loading') {
  return <SkeletonNavbar />;
}

// 4. Remove the "if (pathname === '/login') return null" block — show nav on /login

// 5. Admin link condition:
{user?.is_admin && (
  <Link href="/admin">Quản trị Hệ thống</Link>
)}

// 6. handleLogout simplified (centralized in AuthProvider):
const handleLogout = async () => {
  setIsMenuOpen(false);
  try {
    await logout();
    router.push("/");
  } catch {}
};
```

Modify DesktopNav.tsx:

```typescript
// src/components/layout/DesktopNav.tsx

import Link from "next/link";
import { motion } from "framer-motion";

const publicNavItems = [
  { label: "Pricing", href: "/pricing" },
  { label: "Voices", href: "/voices" },
];

const authNavItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Studio", href: "/studio" },
  { label: "Library", href: "/library" },
  { label: "Voices", href: "/voices" },
  { label: "Dictionary", href: "/dictionary" },
  { label: "API Keys", href: "/api-keys" },
  { label: "Pricing", href: "/pricing" },
];

export function DesktopNav({ isLoggedIn, pathname }: { isLoggedIn: boolean; pathname: string }) {
  const items = isLoggedIn ? authNavItems : publicNavItems;

  return (
    <div className="hidden md:flex items-center gap-0.5">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} className={...}>
            {isActive && <motion.span layoutId="nav-active" ... />}
            <span className="relative z-10">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
```

Modify MobileNav.tsx similarly to show publicNavItems when not logged in.

---

### Task 9: Fix login page callbackUrl validation

**Files:** `src/app/login/page.tsx` [MODIFY]

**Description:** Validate callbackUrl is a local path before redirecting. Covers FR-2.

---

Modify login/page.tsx:

```typescript
// In LoginForm, change the onSuccess handler's redirect:
const callbackUrl = searchParams.get("callbackUrl");
if (callbackUrl && callbackUrl.startsWith("/")) {
  router.push(callbackUrl);
} else {
  router.push("/dashboard");
}
```

Also remove the `notifyAuthStateChanged` call from the loginWithGoogle import dependency — it's now handled inside loginWithGoogle itself (already done in Task 2).

---

### Task 10: Fix middleware to append callbackUrl

**Files:** `src/proxy.ts` [MODIFY]

**Description:** When redirecting to /login, append the original path as callbackUrl. Covers FR-3.

---

Modify proxy.ts:

```typescript
// Change the redirect line from:
const loginUrl = new URL('/login', request.url);
return NextResponse.redirect(loginUrl);

// To:
const loginUrl = new URL('/login', request.url);
loginUrl.searchParams.set('callbackUrl', path);
return NextResponse.redirect(loginUrl);
```

---

### Task 11: Update AppProviders to include AuthProvider

**Files:** `src/components/providers/AppProviders.tsx` [MODIFY]

**Description:** Add AuthProvider wrapping. Remove unused import.

---

Modify AppProviders.tsx:

```typescript
"use client";

import { type ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { I18nProvider } from "@/shared/i18n";
import { NotificationProvider } from "@/shared/notifications/notification-store";
import { AuthProvider } from "@/features/auth";

export function AppProviders({ children }: { children: ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  return (
    <AuthProvider>
      <I18nProvider>
        <NotificationProvider>
          {googleClientId ? (
            <GoogleOAuthProvider clientId={googleClientId}>
              {children}
            </GoogleOAuthProvider>
          ) : (
            children
          )}
        </NotificationProvider>
      </I18nProvider>
    </AuthProvider>
  );
}
```

---

### Task 12: Refactor pages to use useAuth() instead of getCurrentUser()

**Files:** `src/app/dashboard/page.tsx` [MODIFY], `src/app/admin/page.tsx` [MODIFY], `src/app/settings/page.tsx` [MODIFY], `src/app/activate/page.tsx` [MODIFY], `src/features/library/components/LibraryPage.tsx` [MODIFY], `src/features/library/lib/indexed-db.ts` [MODIFY]

**Description:** Replace all direct `getCurrentUser()` calls with `useAuth()`. Use `<RequireRole>` on admin page. Use `<RequireTier>` on library pro features. Covers FR-15, FR-16, FR-17.

---

Dashboard (`src/app/dashboard/page.tsx`):

```typescript
// Remove: import { getCurrentUser } from "@/features/auth/api/auth-api";
// Add: import { useAuth } from "@/features/auth";
// Change fetchData useEffect:
const { user } = useAuth();
const [quota, setQuota] = useState<QuotaStatus | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchQuota = async () => {
    try {
      const quotaData = await apiRequest<QuotaStatus>("/quota");
      setQuota(quotaData);
    } catch { /* ... */ } finally { setLoading(false); }
  };
  fetchQuota();
}, []);

// Use user from useAuth() directly:
{user?.name || user?.email?.split("@")[0] || "..."}
```

Admin (`src/app/admin/page.tsx`):

```typescript
// Remove: import { getCurrentUser } from "@/features/auth/api/auth-api";
// Add: import { RequireRole } from "@/features/auth";
// Remove the manual is_admin check and loading state
// Wrap content in RequireRole:

export default function AdminPage() {
  return (
    <RequireRole roles={['admin']}>
      <AdminContent />
    </RequireRole>
  );
}
```

Settings (`src/app/settings/page.tsx`):

```typescript
// Remove: import { getCurrentUser } from "@/features/auth/api/auth-api";
// Add: import { useAuth } from "@/features/auth";
// Replace getCurrentUser() call with useAuth():
const { user } = useAuth();
// Use user?.email and user?.name directly, remove the useEffect fetching user
```

Activate (`src/app/activate/page.tsx`):

```typescript
// Remove: import { getCurrentUser } from "@/features/auth/api/auth-api";
// Add: import { useAuth } from "@/features/auth";
// Replace checkAuth useEffect with useAuth():
const { user, status } = useAuth();
// user.email is available when status === 'authenticated'
```

LibraryPage (`src/features/library/components/LibraryPage.tsx`):

```typescript
// Remove: import { getCurrentUser } from "@/features/auth/api/auth-api";
// Add: import { useAuth } from "@/features/auth";
// Replace getCurrentUser() with useAuth():
const { user } = useAuth();
const isPro = user?.subscription_tier === 'pro' || user?.subscription_tier === 'enterprise';
// Remove the useEffect that fetches getCurrentUser()
```

IndexedDB (`src/features/library/lib/indexed-db.ts`):

```typescript
// getCurrentUserId needs to work without React context (used outside components)
// Keep the function but use a different strategy:
// Instead of reading localStorage, export a setter and use AuthProvider to call it

let cachedUserId: string = 'anonymous';

export function setCurrentUserId(id: string) {
  cachedUserId = id || 'anonymous';
}

export function getCurrentUserId(): string {
  if (typeof window === 'undefined') return 'anonymous';
  return cachedUserId;
}
```

Then in AuthProvider, after successful /auth/me, call `setCurrentUserId(user.id)`.

---

### Task 13: Cleanup unused imports

**Files:** `src/components/layout/Navbar.tsx` [MODIFY]

**Description:** Remove unused `useSyncExternalStore` import.

---

In Navbar.tsx, remove line:
```typescript
import { useState, useSyncExternalStore } from "react";
```
Change to:
```typescript
import { useState } from "react";
```

---

### Task 14: Update E2E navigation tests

**Files:** `frontend/e2e/navigation.spec.ts` [MODIFY]

**Description:** Verify new behaviors — public nav links visible when not authenticated, callbackUrl in redirect URL, studio redirect includes callbackUrl.

---

```typescript
// frontend/e2e/navigation.spec.ts — add tests:
test("studio redirect includes callbackUrl", async ({ page }) => {
  await page.goto("/studio");
  await page.waitForURL("**/login?callbackUrl=%2Fstudio");
});

test("pricing page is in nav when not authenticated", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("nav a[href='/pricing']")).toBeVisible();
});

test("voices page is in nav when not authenticated", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("nav a[href='/voices']")).toBeVisible();
});

test("navbar shows on login page", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("nav")).toBeVisible();
});
```

---

## 7. Task Dependency Order

```
Task 1 (types + AuthProvider) ──┐
Task 2 (auth-api refactor) ─────┤
Task 3 (api-client refactor) ───┼──→ Task 7 (barrel export, delete old useAuth)
Task 4 (RequireAuth) ───────────┤           │
Task 5 (RequireRole) ───────────┤           ↓
Task 6 (RequireTier) ───────────┘    Task 8 (Navbar refactor)
                                          │
                                      Task 9 (login callbackUrl)
                                      Task 10 (middleware)
                                      Task 11 (AppProviders)
                                      Task 12 (page refactors)
                                      Task 13 (cleanup)
                                      Task 14 (E2E tests)
```

Tasks 1-6 can run in parallel. Tasks 7-14 are sequential (depend on 1-6 being done).

---

## 8. Constraints & Trade-offs

### 8.1 Constraints
- Must not change the backend API contract
- Must maintain existing i18n (I18nProvider) and notification (NotificationProvider) wrapping
- Must preserve existing UI styling patterns (aether-glass, Tailwind classes)

### 8.2 Trade-offs

| Decision | Alternative | Why this choice |
|----------|-------------|-----------------|
| React Context for auth state | Module-level cache + events | Context provides cleaner API, React DevTools support, easier testing |
| RequireAuth shows loading spinner by default | Require AuthProvider to handle loading | Each page may want different loading UI; RequireAuth accepts fallback prop for flexibility |
| indexed-db uses setter injection from AuthProvider | Pass user ID directly to every function | Minimal change to existing library code, backward compatible with 'anonymous' default |
| SkeletonNavbar is a separate component | Inline skeleton in Navbar | Keeps Navbar focused, skeleton reusable if needed |

### 8.3 Out of Scope (Technical)
- Backend auth endpoint changes
- CSRF token setup changes (existing mechanism preserved)
- Multi-factor authentication
- Session timeout UI
- Rate limiting configuration

---

## 9. Change Log

| Date | Version | Changed By | Change Summary | Reason | Affected Sections |
|------|---------|------------|----------------|--------|-------------------|
| 2026-05-06 | v1.0 | Kilo | Initial plan | — | All |
