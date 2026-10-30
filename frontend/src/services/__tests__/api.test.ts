import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  requestApi,
  setAccessTokenGetter,
  setOnAuthExpired,
  setTokenRefreshHandler,
  ApiError,
} from '../api';

describe('requestApi interceptor & refresh queue', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('injects Authorization Bearer header when token getter returns token', async () => {
    setAccessTokenGetter(() => 'valid-mock-token');
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: 'ok' }),
    });
    global.fetch = mockFetch;

    await requestApi('/test-endpoint');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/test-endpoint'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer valid-mock-token',
        }),
      })
    );
  });

  it('queues concurrent 401 requests and performs only a single refresh before replaying', async () => {
    let token = 'initial-expired-token';
    setAccessTokenGetter(() => token);

    let refreshCallCount = 0;
    setTokenRefreshHandler(async () => {
      refreshCallCount++;
      token = 'new-refreshed-token';
      return 'new-refreshed-token';
    });

    let firstCall = true;
    let secondCall = true;

    const mockFetch = vi.fn().mockImplementation(async (url: string, init: RequestInit) => {
      const authHeader = (init?.headers as Record<string, string>)?.Authorization;

      if (url.includes('/protected-resource-1')) {
        if (firstCall && authHeader === 'Bearer initial-expired-token') {
          firstCall = false;
          return { ok: false, status: 401, json: async () => ({ message: 'Unauthorized' }) };
        }
        return { ok: true, status: 200, json: async () => ({ data: 'resource-1' }) };
      }

      if (url.includes('/protected-resource-2')) {
        if (secondCall && authHeader === 'Bearer initial-expired-token') {
          secondCall = false;
          return { ok: false, status: 401, json: async () => ({ message: 'Unauthorized' }) };
        }
        return { ok: true, status: 200, json: async () => ({ data: 'resource-2' }) };
      }

      return { ok: true, status: 200, json: async () => ({ data: 'default' }) };
    });

    global.fetch = mockFetch;

    // Fire two concurrent requests that both receive 401 with the initial token
    const [res1, res2] = await Promise.all([
      requestApi<{ data: string }>('/protected-resource-1'),
      requestApi<{ data: string }>('/protected-resource-2'),
    ]);

    expect(res1.data).toBe('resource-1');
    expect(res2.data).toBe('resource-2');
    expect(refreshCallCount).toBe(1); // Single-flight refresh!
  });

  it('triggers onAuthExpired when refresh fails', async () => {
    setAccessTokenGetter(() => 'expired-token');

    const authExpiredSpy = vi.fn();
    setOnAuthExpired(authExpiredSpy);

    setTokenRefreshHandler(async () => {
      throw new ApiError('Session expired', 401);
    });

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthorized' }),
    });
    global.fetch = mockFetch;

    await expect(requestApi('/some-protected-endpoint')).rejects.toThrow();
    expect(authExpiredSpy).toHaveBeenCalledTimes(1);
  });
});
