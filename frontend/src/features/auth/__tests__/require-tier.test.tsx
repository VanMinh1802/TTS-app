import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

const mockUseAuth = vi.fn();

vi.mock('../components/AuthProvider', () => ({
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
    const child = React.createElement('div', null, 'Pro Feature');
    const { getByText } = render(
      React.createElement(RequireTier, { tiers: ['pro', 'enterprise'], children: child } as any)
    );
    expect(getByText('Pro Feature')).toBeDefined();
  });

  test('TC-12: renders UpgradePrompt when user tier is lower', () => {
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      user: { id: '2', email: 'c@d.com', name: 'Free', is_admin: false, subscription_tier: 'free' },
    });
    const child = React.createElement('div', null, 'Pro Feature');
    const { container } = render(
      React.createElement(RequireTier, { tiers: ['pro', 'enterprise'], children: child } as any)
    );
    expect(container.textContent).toContain('nâng cấp');
  });

  test('enterprise user can access pro features', () => {
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      user: { id: '3', email: 'e@f.com', name: 'Ent', is_admin: false, subscription_tier: 'enterprise' },
    });
    const child = React.createElement('div', null, 'Pro-Only');
    const { getByText } = render(
      React.createElement(RequireTier, { tiers: ['pro'], children: child } as any)
    );
    expect(getByText('Pro-Only')).toBeDefined();
  });

  test('shows loading spinner when auth state is loading', () => {
    mockUseAuth.mockReturnValue({ status: 'loading', user: null });
    const child = React.createElement('div', null, 'X');
    const { container } = render(
      React.createElement(RequireTier, { tiers: ['pro'], children: child } as any)
    );
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });
});
