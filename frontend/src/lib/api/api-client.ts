import { ApiError } from './api-error';
import { tokenStorage } from '../auth/token-storage';

type AuthenticationMode = 'required' | 'optional' | 'none';

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
  timeoutMs?: number;
  auth?: AuthenticationMode;
}

export type RefreshHandler = () => Promise<void>;

let refreshHandler: RefreshHandler | null = null;

export function setRefreshHandler(handler: RefreshHandler | null): void {
  refreshHandler = handler;
}

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL?.trim() || '/api/v1'
).replace(/\/+$/, '');

const DEFAULT_TIMEOUT_MS = 15_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function parseError(response: Response): Promise<ApiError> {
  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  if (isRecord(payload)) {
    const message =
      typeof payload.message === 'string'
        ? payload.message
        : typeof payload.detail === 'string'
          ? payload.detail
          : `Request failed with status ${response.status}.`;

    const code =
      typeof payload.code === 'string' ? payload.code : undefined;

    return new ApiError(response.status, message, code, payload);
  }

  return new ApiError(
    response.status,
    `Request failed with status ${response.status}.`,
  );
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    throw new ApiError(
      response.status,
      'The server returned an unexpected response format.',
      'UNEXPECTED_RESPONSE_FORMAT',
    );
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError(
      response.status,
      'The server returned invalid JSON.',
      'INVALID_RESPONSE_JSON',
    );
  }
}

async function request<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    body,
    headers: suppliedHeaders,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    auth = 'required',
  } = options;

  if (path.startsWith('/') || path.includes('://')) {
    throw new Error(
      'API paths must be relative, for example "auth/login".',
    );
  }

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error('timeoutMs must be a positive finite number.');
  }

  const headers = new Headers(suppliedHeaders);
  headers.set('Accept', 'application/json');

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (auth !== 'none') {
    const accessToken = tokenStorage.getAccessToken();

    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    } else if (auth === 'required') {
      throw new ApiError(
        401,
        'Authentication is required.',
        'AUTHENTICATION_REQUIRED',
      );
    }
  }

  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const abortFromCaller = () => controller.abort();

  if (signal?.aborted) {
    controller.abort();
  } else {
    signal?.addEventListener('abort', abortFromCaller, { once: true });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

        if (
      response.status === 401 &&
      auth === 'required' &&
      refreshHandler
    ) {
      await refreshHandler();

      const retryHeaders = new Headers(suppliedHeaders);
      retryHeaders.set('Accept', 'application/json');

      if (body !== undefined) {
        retryHeaders.set('Content-Type', 'application/json');
      }

      const newAccessToken = tokenStorage.getAccessToken();

      if (!newAccessToken) {
        throw new ApiError(
          401,
          'Your session has expired. Please sign in again.',
          'SESSION_EXPIRED',
        );
      }

      retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);

      const retryResponse = await fetch(`${API_BASE_URL}/${path}`, {
        method,
        headers: retryHeaders,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });

      if (!retryResponse.ok) {
        throw await parseError(retryResponse);
      }

      return await parseResponse<T>(retryResponse);
    }

    if (!response.ok) {
      throw await parseError(response);
    }

    return await parseResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (timedOut) {
      throw new ApiError(
        0,
        'The request timed out.',
        'REQUEST_TIMEOUT',
      );
    }

    if (signal?.aborted) {
      throw error;
    }

    throw new ApiError(
      0,
      'Unable to reach the server. Check your network connection.',
      'NETWORK_ERROR',
    );
  } finally {
    globalThis.clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abortFromCaller);
  }
}

export const apiClient = {
  get<T>(path: string, options: Omit<ApiRequestOptions, 'method' | 'body'> = {}) {
    return request<T>(path, { ...options, method: 'GET' });
  },

  post<T>(
    path: string,
    body?: unknown,
    options: Omit<ApiRequestOptions, 'method' | 'body'> = {},
  ) {
    return request<T>(path, { ...options, method: 'POST', body });
  },

  put<T>(
    path: string,
    body: unknown,
    options: Omit<ApiRequestOptions, 'method' | 'body'> = {},
  ) {
    return request<T>(path, { ...options, method: 'PUT', body });
  },

  patch<T>(
    path: string,
    body: unknown,
    options: Omit<ApiRequestOptions, 'method' | 'body'> = {},
  ) {
    return request<T>(path, { ...options, method: 'PATCH', body });
  },

  delete<T>(
    path: string,
    options: Omit<ApiRequestOptions, 'method' | 'body'> = {},
  ) {
    return request<T>(path, { ...options, method: 'DELETE' });
  },
};