import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import * as authApi from '../api/auth.api';
import { AuthProvider } from '../auth/AuthContext';
import { notifyUnauthorized } from '../auth/unauthorizedHandler';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { clearAuthToken, getAuthToken, setAuthToken } from '../auth/authToken';
import { LoginPage } from '../pages/LoginPage';
import { ROUTES } from '../routes/paths';
import { authenticatedUserFixture } from '../test/fixtures/auth';
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

function renderSessionApp(initialPath: string, queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <Routes>
            <Route element={<LoginPage />} path={ROUTES.login} />
            <Route element={<ProtectedRoute />}>
              <Route
                element={<div>Protected content</div>}
                path={ROUTES.dashboard}
              />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('session expiration', () => {
  beforeEach(() => {
    clearAuthToken();
    vi.clearAllMocks();
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(
      authenticatedUserFixture,
    );
  });

  it('logs out globally when an authenticated request returns 401', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    setAuthToken('stored-token');
    queryClient.setQueryData(['dashboard', null], { cached: true });

    renderSessionApp(ROUTES.dashboard, queryClient);

    await waitFor(() => {
      expect(screen.getByText('Protected content')).toBeInTheDocument();
    });

    notifyUnauthorized();

    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    expect(getAuthToken()).toBeNull();
    expect(queryClient.getQueryData(['dashboard', null])).toBeUndefined();
    expect(toastStore.toast.error).toHaveBeenCalledWith(
      'La sesión expiró. Inicia sesión nuevamente.',
    );
  });

  it('handles concurrent 401 responses with a single logout redirect', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    setAuthToken('stored-token');

    renderSessionApp(ROUTES.dashboard, queryClient);

    await waitFor(() => {
      expect(screen.getByText('Protected content')).toBeInTheDocument();
    });

    notifyUnauthorized();
    notifyUnauthorized();

    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    expect(toastStore.toast.error).toHaveBeenCalledTimes(1);
    expect(getAuthToken()).toBeNull();
  });
});
