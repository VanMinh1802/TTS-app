import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

const mockUseAuth = vi.fn();
const mockRouter = { push: vi.fn() };

vi.mock('../components/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/test-page',
}));

import { RequireAuth } from '../components/RequireAuth';

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
      React.createElement(RequireAuth, null, React.createElement('div', null, 'Protected Content'))
    );
    expect(getByText('Protected Content')).toBeDefined();
  });

  test('TC-07: redirects to /login when unauthenticated', () => {
    mockUseAuth.mockReturnValue({ status: 'unauthenticated', user: null });
    render(React.createElement(RequireAuth, null, React.createElement('div', null, 'X')));
    expect(mockRouter.push).toHaveBeenCalledWith('/login?callbackUrl=%2Ftest-page');
  });

  test('TC-08: renders loading fallback when status is loading', () => {
    mockUseAuth.mockReturnValue({ status: 'loading', user: null });
    const LoadingFallback = React.createElement('div', null, 'Loading...');
    const { container } = render(
      React.createElement(RequireAuth, { loadingFallback: LoadingFallback, children: React.createElement('div', null, 'X') as any })
    );
    expect(container.textContent).toContain('Loading...');
  });

  test('shows default spinner when loading and no fallback', () => {
    mockUseAuth.mockReturnValue({ status: 'loading', user: null });
    const { container } = render(
      React.createElement(RequireAuth, null, React.createElement('div', null, 'X'))
    );
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });
});
