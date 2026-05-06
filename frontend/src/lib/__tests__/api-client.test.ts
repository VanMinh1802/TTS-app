import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

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
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('console', { ...console, error: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('TC-15: retries with refreshed token on 401', async () => {
    const successData = { result: 'ok' };

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
        json: async () => ({ detail: 'Unauthorized' }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ access_token: 'new_token' }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify(successData),
      } as unknown as Response);

    const result = await apiRequest('/test', { method: 'GET' });
    expect(result).toEqual(successData);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  test('TC-16: redirects to /login when refresh fails', async () => {
    const originalLocation = window.location;
    delete (window as any).location;
    (window as any).location = { href: '', pathname: '/dashboard' };

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
        json: async () => ({ detail: 'Unauthorized' }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        headers: new Headers(),
      } as unknown as Response);

    await expect(apiRequest('/test', { method: 'GET' })).rejects.toThrow(ApiError);

    expect(notificationService.notify).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'warning', source: 'auth' })
    );
    expect(window.location.href).toBe('/login');

    (window as any).location = originalLocation;
  });

  test('builds headers without reading localStorage', async () => {
    localStorage.setItem('access_token', 'should-be-ignored');

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      text: async () => JSON.stringify({ ok: true }),
    } as unknown as Response);

    await apiRequest('/test', { method: 'GET' });

    const callArgs = vi.mocked(fetch).mock.calls[0];
    const callHeaders = callArgs[1]?.headers as Headers;
    expect(callHeaders.get('Authorization')).toBeNull();
    expect(callHeaders.get('Content-Type')).toBeNull();

    localStorage.removeItem('access_token');
  });

  test('attaches Content-Type for JSON body', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      text: async () => JSON.stringify({ ok: true }),
    } as unknown as Response);

    await apiRequest('/test', { method: 'POST', body: JSON.stringify({ x: 1 }) });

    const callHeaders = vi.mocked(fetch).mock.calls[0][1]?.headers as Headers;
    expect(callHeaders.get('Content-Type')).toBe('application/json');
  });
});
