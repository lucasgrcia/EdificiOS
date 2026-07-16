import axios, { type AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as unauthorizedHandler from '../auth/unauthorizedHandler';
import * as toastStore from '../toast/toastStore';
import { authenticatedApiClient, publicApiClient } from './client';

vi.mock('../auth/unauthorizedHandler', () => ({
  notifyUnauthorized: vi.fn(),
}));

vi.mock('../toast/toastStore', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

function createAxiosError(status?: number): AxiosError {
  if (status === undefined) {
    return new axios.AxiosError('Network Error', 'ERR_NETWORK');
  }

  return new axios.AxiosError(
    'Request failed',
    String(status),
    undefined,
    undefined,
    {
      status,
      statusText: 'Error',
      headers: {},
      config: { headers: new axios.AxiosHeaders() },
      data: {
        title: 'Error',
        detail: 'Functional error',
        status,
      },
    },
  );
}

function getRejectedInterceptor(client: typeof publicApiClient) {
  const handlers = client.interceptors.response.handlers;

  if (handlers === undefined || handlers.length === 0) {
    throw new Error('Missing response interceptor');
  }

  const rejected = handlers[handlers.length - 1]?.rejected;

  if (rejected === undefined) {
    throw new Error('Missing response interceptor');
  }

  return rejected;
}

describe('api client interceptors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not trigger global logout when login returns 401', async () => {
    const error = createAxiosError(401);
    const rejected = getRejectedInterceptor(publicApiClient);

    await expect(rejected(error)).rejects.toBe(error);
    expect(unauthorizedHandler.notifyUnauthorized).not.toHaveBeenCalled();
  });

  it('triggers global logout when an authenticated request returns 401', async () => {
    const error = createAxiosError(401);
    const rejected = getRejectedInterceptor(authenticatedApiClient);

    await expect(rejected(error)).rejects.toBe(error);
    expect(unauthorizedHandler.notifyUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('shows a toast only for network errors', async () => {
    const networkError = createAxiosError();
    const rejected = getRejectedInterceptor(authenticatedApiClient);

    await expect(rejected(networkError)).rejects.toBe(networkError);
    expect(toastStore.toast.error).toHaveBeenCalledWith(
      'Error de red',
      'No pudimos conectar con el servidor. Verificá tu conexión e intentá de nuevo.',
    );
    expect(unauthorizedHandler.notifyUnauthorized).not.toHaveBeenCalled();
  });

  it('does not treat functional 4xx errors as session expiration', async () => {
    const error = createAxiosError(400);
    const rejected = getRejectedInterceptor(authenticatedApiClient);

    await expect(rejected(error)).rejects.toBe(error);
    expect(unauthorizedHandler.notifyUnauthorized).not.toHaveBeenCalled();
    expect(toastStore.toast.error).not.toHaveBeenCalled();
  });
});
