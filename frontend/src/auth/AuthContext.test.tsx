import { renderHook, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as authApi from '../api/auth.api';
import { useAuthContext } from './AuthContext';
import { clearAuthToken, getAuthToken, setAuthToken } from './authToken';
import {
  authenticatedUserFixture,
  createUnauthorizedAxiosError,
} from '../test/fixtures/auth';
import { createAuthTestWrapper } from '../test/support/auth-test-wrapper';
import * as toastStore from '../toast/toastStore';

vi.mock('../api/auth.api', () => ({
  login: vi.fn(),
  fetchCurrentUser: vi.fn(),
}));

vi.mock('../toast/toastStore', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

describe('AuthContext', () => {
  beforeEach(() => {
    clearAuthToken();
    vi.clearAllMocks();
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(
      authenticatedUserFixture,
    );
  });

  it('completes login successfully and stores the token', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      accessToken: 'issued-token',
      expiresIn: 3600,
    });

    const { AuthTestWrapper } = createAuthTestWrapper();

    const { result } = renderHook(() => useAuthContext(), {
      wrapper: AuthTestWrapper,
    });

    await act(async () => {
      await result.current.login('demo@edificios.local');
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    expect(getAuthToken()).toBe('issued-token');
    expect(result.current.user).toEqual(authenticatedUserFixture);
    expect(authApi.login).toHaveBeenCalledWith({
      email: 'demo@edificios.local',
    });
    expect(authApi.fetchCurrentUser).toHaveBeenCalled();
  });

  it('clears the session when login returns 401 without global expiration toast', async () => {
    vi.mocked(authApi.login).mockRejectedValue(createUnauthorizedAxiosError());

    const { AuthTestWrapper } = createAuthTestWrapper();

    const { result } = renderHook(() => useAuthContext(), {
      wrapper: AuthTestWrapper,
    });

    let loginError: unknown;

    await act(async () => {
      try {
        await result.current.login('missing@edificios.local');
      } catch (error) {
        loginError = error;
      }
    });

    expect(loginError).toBeDefined();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(getAuthToken()).toBeNull();
    expect(toastStore.toast.error).not.toHaveBeenCalledWith(
      'La sesión expiró. Inicia sesión nuevamente.',
    );
  });

  it('restores the session when a stored token is valid', async () => {
    setAuthToken('stored-token');

    const { AuthTestWrapper } = createAuthTestWrapper();

    const { result } = renderHook(() => useAuthContext(), {
      wrapper: AuthTestWrapper,
    });

    await waitFor(() => {
      expect(result.current.isInitializing).toBe(false);
    });

    expect(result.current.user).toEqual(authenticatedUserFixture);
    expect(result.current.isAuthenticated).toBe(true);
    expect(authApi.fetchCurrentUser).toHaveBeenCalled();
  });

  it('clears the session silently when session restoration fails', async () => {
    setAuthToken('expired-token');
    vi.mocked(authApi.fetchCurrentUser).mockRejectedValue(
      createUnauthorizedAxiosError(),
    );

    const { AuthTestWrapper, queryClient } = createAuthTestWrapper();
    queryClient.setQueryData(['dashboard', null], { cached: true });

    const { result } = renderHook(() => useAuthContext(), {
      wrapper: AuthTestWrapper,
    });

    await waitFor(() => {
      expect(result.current.isInitializing).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(getAuthToken()).toBeNull();
    expect(queryClient.getQueryData(['dashboard', null])).toBeUndefined();
    expect(toastStore.toast.error).not.toHaveBeenCalled();
  });

  it('clears the session on logout and redirects to login', async () => {
    setAuthToken('stored-token');

    const { AuthTestWrapper, queryClient } = createAuthTestWrapper('/dashboard');
    queryClient.setQueryData(['dashboard', null], { cached: true });

    const { result } = renderHook(() => useAuthContext(), {
      wrapper: AuthTestWrapper,
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(getAuthToken()).toBeNull();
    expect(queryClient.getQueryData(['dashboard', null])).toBeUndefined();
    expect(toastStore.toast.info).toHaveBeenCalledWith(
      'Sesión cerrada',
      'Tu token fue eliminado de este dispositivo.',
    );
  });
});
