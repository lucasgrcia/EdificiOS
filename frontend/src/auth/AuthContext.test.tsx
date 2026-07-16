import { renderHook, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as authApi from '../api/auth.api';
import { AuthProvider, useAuthContext } from './AuthContext';
import { clearAuthToken, getAuthToken, setAuthToken } from './authToken';
import {
  authenticatedUserFixture,
  createUnauthorizedAxiosError,
} from '../test/fixtures/auth';

vi.mock('../api/auth.api', () => ({
  login: vi.fn(),
  fetchCurrentUser: vi.fn(),
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

    const { result } = renderHook(() => useAuthContext(), {
      wrapper: AuthProvider,
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

  it('clears the session when login returns 401', async () => {
    vi.mocked(authApi.login).mockRejectedValue(createUnauthorizedAxiosError());

    const { result } = renderHook(() => useAuthContext(), {
      wrapper: AuthProvider,
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
  });

  it('loads the current user after a successful GET /me on bootstrap', async () => {
    setAuthToken('stored-token');

    const { result } = renderHook(() => useAuthContext(), {
      wrapper: AuthProvider,
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(authenticatedUserFixture);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(authApi.fetchCurrentUser).toHaveBeenCalled();
  });

  it('clears the session on logout', async () => {
    setAuthToken('stored-token');

    const { result } = renderHook(() => useAuthContext(), {
      wrapper: AuthProvider,
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
  });
});
