import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ApiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('parses successful JSON response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'ok' }),
      text: () => Promise.resolve(''),
    } as any);

    const { apiClient } = await import('../../services/api-client');
    const result = await apiClient.get<{ data: string }>('/test');
    expect(result.data).toBe('ok');
  });

  it('throws on HTTP error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: () => Promise.resolve('Resource not found'),
    } as any);

    const { apiClient } = await import('../../services/api-client');
    await expect(apiClient.get('/not-found')).rejects.toThrow('HTTP 404');
  });

  it('retries on network failure', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ retried: true }),
      text: () => Promise.resolve(''),
    } as any);

    const { apiClient } = await import('../../services/api-client');
    const result = await apiClient.get<{ retried: boolean }>('/retry');
    expect(result.retried).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('sends JSON body on POST', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 1 }),
      text: () => Promise.resolve(''),
    } as any);

    const { apiClient } = await import('../../services/api-client');
    await apiClient.post('/create', { name: 'test' });
    expect(fetchMock).toHaveBeenCalledWith('/create', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ name: 'test' }),
    }));
  });
});
