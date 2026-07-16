import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import * as authApi from '../api/auth.api';
import * as dashboardApi from '../api/dashboard.api';
import { AuthProvider } from '../auth/AuthContext';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { clearAuthToken, setAuthToken } from '../auth/authToken';
import { DashboardPage } from '../pages/DashboardPage';
import { IncidentsPage } from '../pages/IncidentsPage';
import { ROUTES } from '../routes/paths';
import { authenticatedUserFixture } from '../test/fixtures/auth';
import { dashboardViewFixture } from '../test/fixtures/dashboard';

vi.mock('../api/auth.api', () => ({
  login: vi.fn(),
  fetchCurrentUser: vi.fn(),
}));

vi.mock('../api/dashboard.api', () => ({
  fetchDashboard: vi.fn(),
}));

function renderIncidentsFromDashboard(queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[ROUTES.dashboard]}>
        <AuthProvider>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardPage />} path={ROUTES.dashboard} />
              <Route element={<IncidentsPage />} path={ROUTES.incidents} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('IncidentsPage', () => {
  beforeEach(() => {
    clearAuthToken();
    vi.clearAllMocks();
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(
      authenticatedUserFixture,
    );
    vi.mocked(dashboardApi.fetchDashboard).mockResolvedValue(
      dashboardViewFixture,
    );
  });

  it('reuses dashboard cache without refetching when navigating from dashboard', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    setAuthToken('stored-token');
    renderIncidentsFromDashboard(queryClient);

    await waitFor(() => {
      expect(dashboardApi.fetchDashboard).toHaveBeenCalledTimes(1);
    });

    await user.click(screen.getByRole('link', { name: 'Ver todas' }));

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Incidencias' }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole('link', {
        name: dashboardViewFixture.recentIncidents[0]?.description,
      }),
    ).toBeInTheDocument();
    expect(dashboardApi.fetchDashboard).toHaveBeenCalledTimes(1);
  });
});
