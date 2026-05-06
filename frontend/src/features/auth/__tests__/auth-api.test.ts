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

  test('loginWithGoogle calls the correct API endpoint', async () => {
    const mockResponse = { access_token: 'eyJ...', token_type: 'bearer' };
    vi.mocked(apiRequest).mockResolvedValue(mockResponse);

    await loginWithGoogle('google-credential');

    expect(apiRequest).toHaveBeenCalledWith('/auth/login/google', {
      method: 'POST',
      body: JSON.stringify({ credential: 'google-credential' }),
    });
  });

  test('TC-14: logout calls API and notifies state change', async () => {
    vi.mocked(apiRequest).mockResolvedValue(undefined);

    const dispatchSpy = vi.fn();
    window.addEventListener('auth-state-changed', dispatchSpy);

    await logout();

    expect(apiRequest).toHaveBeenCalledWith('/auth/logout', { method: 'POST', allowEmpty: true });
    expect(dispatchSpy).toHaveBeenCalled();

    window.removeEventListener('auth-state-changed', dispatchSpy);
  });

  test('getCurrentUser calls /auth/me', async () => {
    vi.mocked(apiRequest).mockResolvedValue({ id: '1', email: 'a@b.com', name: 'Test' });
    await getCurrentUser();
    expect(apiRequest).toHaveBeenCalledWith('/auth/me');
  });
});
