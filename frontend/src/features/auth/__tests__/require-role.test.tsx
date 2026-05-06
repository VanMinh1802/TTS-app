import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

const mockUseAuth = vi.fn();

vi.mock('../components/AuthProvider', () => ({
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
    const child = React.createElement('div', null, 'Admin Panel');
    const { getByText } = render(
      React.createElement(RequireRole, { roles: ['admin'], children: child } as any)
    );
    expect(getByText('Admin Panel')).toBeDefined();
  });

  test('TC-10: renders AccessDenied when user lacks role', () => {
    mockUseAuth.mockReturnValue({ status: 'authenticated', user: regularUser });
    const child = React.createElement('div', null, 'Admin Panel');
    const { container } = render(
      React.createElement(RequireRole, { roles: ['admin'], children: child } as any)
    );
    expect(container.textContent).toContain('Truy cập bị từ chối');
  });

  test('shows loading spinner when auth state is loading', () => {
    mockUseAuth.mockReturnValue({ status: 'loading', user: null });
    const child = React.createElement('div', null, 'X');
    const { container } = render(
      React.createElement(RequireRole, { roles: ['admin'], children: child } as any)
    );
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });
});
