import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import React from 'react';
import { AuthProvider, useAuth } from '../index';

vi.mock('../api/auth-api', () => ({
  getCurrentUser: vi.fn(),
  loginWithGoogle: vi.fn(),
  logout: vi.fn(),
}));

import { getCurrentUser } from '../api/auth-api';

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
  React.useEffect(() => { onRender(auth); }, [auth, onRender]);
  return React.createElement('div', null, auth.status);
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('TC-01: AuthProvider renders loading state initially', async () => {
    vi.mocked(getCurrentUser).mockImplementation(() => new Promise(() => {}));

    const renders: ReturnType<typeof useAuth>[] = [];
    render(
      React.createElement(AuthProvider, null,
        React.createElement(TestConsumer, { onRender: (data: any) => renders.push(data) })
      )
    );

    await waitFor(() => {
      expect(renders.length).toBeGreaterThan(0);
    });
    expect(renders[0].status).toBe('loading');
    expect(renders[0].user).toBeNull();
  });

  test('TC-02: AuthProvider sets authenticated state on successful /auth/me', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);

    let lastRender: ReturnType<typeof useAuth> | null = null;
    render(
      React.createElement(AuthProvider, null,
        React.createElement(TestConsumer, { onRender: (data: any) => { lastRender = data; } })
      )
    );

    await waitFor(() => {
      expect(lastRender?.status).toBe('authenticated');
    });
    expect((lastRender as any)?.user).toEqual(mockUser);
  });

  test('TC-03: AuthProvider sets unauthenticated state on failed /auth/me', async () => {
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('Unauthorized'));

    let lastRender: ReturnType<typeof useAuth> | null = null;
    render(
      React.createElement(AuthProvider, null,
        React.createElement(TestConsumer, { onRender: (data: any) => { lastRender = data; } })
      )
    );

    await waitFor(() => {
      expect(lastRender?.status).toBe('unauthenticated');
    });
    expect((lastRender as any)?.user).toBeNull();
  });

  test('TC-05: AuthProvider calls /auth/me exactly once', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser);

    render(
      React.createElement(AuthProvider, null,
        React.createElement(TestConsumer, { onRender: () => {} }),
        React.createElement(TestConsumer, { onRender: () => {} }),
        React.createElement(TestConsumer, { onRender: () => {} })
      )
    );

    await waitFor(() => {
      expect(getCurrentUser).toHaveBeenCalledTimes(1);
    });
  });
});
