import { describe, expect, it, vi } from 'vitest';
import {
  API_BASE_URL,
  ApiError,
  apiGet,
  apiPost,
  isAbortError,
  NETWORK_ERROR_STATUS,
} from './http';

function mockFetchResponse(body: unknown, init: ResponseInit = {}): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(() => Promise.resolve(Response.json(body, { status: 200, ...init })));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function getRequestedUrl(fetchMock: ReturnType<typeof vi.fn>): URL {
  const [input] = fetchMock.mock.calls[0] as [string];
  return new URL(input);
}

describe('apiGet', () => {
  it('requests the API path and returns the parsed body', async () => {
    const fetchMock = mockFetchResponse({ data: [1, 2] });

    await expect(apiGet('/leaderboard')).resolves.toEqual({ data: [1, 2] });
    expect(getRequestedUrl(fetchMock).href).toBe(`${API_BASE_URL}/leaderboard`);
  });

  it('serializes query parameters and skips undefined values', async () => {
    const fetchMock = mockFetchResponse({ data: [] });

    await apiGet('/games', { page: 2, category: 'puzzle', sort: undefined });

    const url = getRequestedUrl(fetchMock);
    expect(url.searchParams.get('page')).toBe('2');
    expect(url.searchParams.get('category')).toBe('puzzle');
    expect(url.searchParams.has('sort')).toBe(false);
  });

  it('passes the abort signal to fetch', async () => {
    const fetchMock = mockFetchResponse({ data: [] });
    const controller = new AbortController();

    await apiGet('/games', undefined, controller.signal);

    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), { signal: controller.signal });
  });

  it('throws ApiError with the server message for non-2xx responses', async () => {
    mockFetchResponse({ error: 'Game not found: nope' }, { status: 404 });

    const request = apiGet('/games/nope');

    await expect(request).rejects.toBeInstanceOf(ApiError);
    await expect(request).rejects.toMatchObject({ status: 404, message: 'Game not found: nope' });
  });

  it('falls back to a generic message when the error body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('<html>', { status: 502 }))),
    );

    await expect(apiGet('/games')).rejects.toMatchObject({
      status: 502,
      message: 'Request failed with status 502',
    });
  });

  it('maps network failures to status 0', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    );

    await expect(apiGet('/games')).rejects.toMatchObject({ status: NETWORK_ERROR_STATUS });
  });

  it('rethrows aborts untouched so callers can ignore them', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(abortError)),
    );

    await expect(apiGet('/games')).rejects.toBe(abortError);
  });
});

describe('apiPost', () => {
  it('sends a JSON body with POST and returns the parsed response', async () => {
    const fetchMock = mockFetchResponse({ data: { ok: true } }, { status: 201 });

    await expect(apiPost('/games/x/comments', { text: 'Hi' })).resolves.toEqual({
      data: { ok: true },
    });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`${API_BASE_URL}/games/x/comments`);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(init.body).toBe('{"text":"Hi"}');
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it('rejects with the server message when the server refuses', async () => {
    mockFetchResponse({ error: 'Authentication required' }, { status: 401 });

    await expect(apiPost('/games/x/favorite', {})).rejects.toMatchObject({
      status: 401,
      message: 'Authentication required',
    });
  });

  it('reports a timeout as an unknown outcome (status 0)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new DOMException('Timed out', 'TimeoutError'))),
    );

    await expect(apiPost('/games/x/favorite', {})).rejects.toMatchObject({
      status: NETWORK_ERROR_STATUS,
      message: 'The request timed out.',
    });
  });

  it('combines a caller signal with the timeout and keeps aborts silent', async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const request = apiPost('/games/x/favorite', {}, controller.signal);
    controller.abort();

    await expect(request).rejects.toSatisfy(isAbortError);
  });
});

describe('isAbortError', () => {
  it('recognizes only DOMException aborts', () => {
    expect(isAbortError(new DOMException('Aborted', 'AbortError'))).toBe(true);
    expect(isAbortError(new DOMException('Other', 'NotFoundError'))).toBe(false);
    expect(isAbortError(new Error('AbortError'))).toBe(false);
  });
});
