export const API_BASE_URL = 'https://faxb76kxra.execute-api.eu-central-1.amazonaws.com/api';

// Network failures (offline, DNS, CORS) never reach the server, so they get a status of 0.
export const NETWORK_ERROR_STATUS = 0;

// Mutations give up after this long; their outcome is then unknown.
export const MUTATION_TIMEOUT_MS = 15_000;

export type QueryParameters = Readonly<Record<string, string | number | undefined>>;

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function buildUrl(path: string, parameters?: QueryParameters): string {
  const url = new URL(`${API_BASE_URL}${path}`);

  if (parameters !== undefined) {
    for (const [name, value] of Object.entries(parameters)) {
      if (value !== undefined) {
        url.searchParams.set(name, String(value));
      }
    }
  }

  return url.href;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    const body: unknown = await response.json();
    return body;
  } catch {
    return undefined;
  }
}

function getErrorMessage(body: unknown, status: number): string {
  if (typeof body === 'object' && body !== null && 'error' in body) {
    const { error } = body;
    if (typeof error === 'string') {
      return error;
    }
  }

  return `Request failed with status ${String(status)}`;
}

function isTimeoutError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'TimeoutError';
}

async function request<T>(url: string, init: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, init);
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    // Lost connection or timeout: the server may or may not have handled it.
    throw new ApiError(
      isTimeoutError(error)
        ? 'The request timed out.'
        : 'Network error. Check your connection and try again.',
      NETWORK_ERROR_STATUS,
    );
  }

  const body = await readJson(response);

  if (!response.ok) {
    throw new ApiError(getErrorMessage(body, response.status), response.status);
  }

  return body as T;
}

export function apiGet<T>(
  path: string,
  parameters?: QueryParameters,
  signal?: AbortSignal,
): Promise<T> {
  return request<T>(buildUrl(path, parameters), signal === undefined ? {} : { signal });
}

// A status of NETWORK_ERROR_STATUS from a POST means "outcome unknown":
// callers must not retry automatically, since toggles would flip back.
export function apiPost<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const timeout = AbortSignal.timeout(MUTATION_TIMEOUT_MS);

  return request<T>(buildUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: signal === undefined ? timeout : AbortSignal.any([signal, timeout]),
  });
}
