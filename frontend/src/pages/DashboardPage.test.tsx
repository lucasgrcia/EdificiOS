import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import * as authApi from '../api/auth.api';
import * as dashboardApi from '../api/dashboard.api';
import { AuthProvider } from '../auth/AuthContext';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { setAuthToken, clearAuthToken } from '../auth/authToken';
import { DashboardPage } from './DashboardPage';
import { LoginPage } from './LoginPage';
import { ROUTES } from '../routes/paths';
import {
  authenticatedUserFixture,
} from '../test/fixtures/auth';
import { dashboardViewFixture } from '../test/fixtures/dashboard';

vi.mock('../api/auth.api', () => ({
  login: vi.fn(),
  fetchCurrentUser: vi.fn(),
}));

vi.mock('../api/dashboard.api', () => ({
  fetchDashboard: vi.fn(),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function renderDashboardFlow(initialPath: string = ROUTES.dashboard) {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <Routes>
            <Route element={<LoginPage />} path={ROUTES.login} />
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardPage />} path={ROUTES.dashboard} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    clearAuthToken();
    vi.clearAllMocks();
    vi.mocked(dashboardApi.fetchDashboard).mockResolvedValue(dashboardViewFixture);
  });

  it('calls dashboard API with actorId when user has actorId', async () => {
    setAuthToken('stored-token');
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(
      authenticatedUserFixture,
    );

    renderDashboardFlow(ROUTES.dashboard);

    await waitFor(() => {
      expect(dashboardApi.fetchDashboard).toHaveBeenCalledWith({
        actorId: authenticatedUserFixture.actorId,
      });
    });

    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }),
    ).toBeInTheDocument();
  });

  it('calls dashboard API without actorId when user has no actorId', async () => {
    setAuthToken('stored-token');
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue({
      ...authenticatedUserFixture,
      actorId: undefined,
    });

    renderDashboardFlow(ROUTES.dashboard);

    await waitFor(() => {
      expect(dashboardApi.fetchDashboard).toHaveBeenCalledWith(undefined);
    });
  });

  it('uses actorId from /me after login before loading dashboard', async () => {
    const user = userEvent.setup();

    vi.mocked(authApi.login).mockResolvedValue({
      accessToken: 'issued-token',
      expiresIn: 3600,
    });
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(
      authenticatedUserFixture,
    );

    renderDashboardFlow(ROUTES.login);

    await user.type(
      screen.getByLabelText('Email'),
      'demo@edificios.local',
    );
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => {
      expect(dashboardApi.fetchDashboard).toHaveBeenCalledWith({
        actorId: authenticatedUserFixture.actorId,
      });
    });

    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }),
    ).toBeInTheDocument();
    expect(authApi.fetchCurrentUser).toHaveBeenCalled();
  });
});
