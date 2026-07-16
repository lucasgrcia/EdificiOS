import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import * as authApi from '../api/auth.api';
import * as dashboardApi from '../api/dashboard.api';
import * as incidentApi from '../api/incident.api';
import * as infoApi from '../api/info.api';
import { AuthProvider } from '../auth/AuthContext';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { clearAuthToken, getAuthToken, setAuthToken } from '../auth/authToken';
import { DashboardPage } from '../pages/DashboardPage';
import { HomePage } from '../pages/HomePage';
import { IncidentDetailsPage } from '../pages/IncidentDetailsPage';
import { LoginPage } from '../pages/LoginPage';
import { ROUTES } from '../routes/paths';
import { apiInfoFixture } from '../test/fixtures/api-info';
import { authenticatedUserFixture } from '../test/fixtures/auth';
import {
  dashboardIncidentFixture,
  dashboardViewFixture,
  incidentViewFixture,
  timelineFixture,
} from '../test/fixtures/dashboard';

vi.mock('../api/auth.api', () => ({
  login: vi.fn(),
  fetchCurrentUser: vi.fn(),
}));

vi.mock('../api/info.api', () => ({
  fetchApiInfo: vi.fn(),
}));

vi.mock('../api/dashboard.api', () => ({
  fetchDashboard: vi.fn(),
}));

vi.mock('../api/incident.api', () => ({
  fetchIncident: vi.fn(),
  fetchIncidentTimeline: vi.fn(),
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

function renderDemoApp(
  initialPath: string,
  queryClient = createTestQueryClient(),
) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <Routes>
            <Route element={<HomePage />} path={ROUTES.home} />
            <Route element={<LoginPage />} path={ROUTES.login} />
            <Route
              element={<IncidentDetailsPage />}
              path={ROUTES.incidentDetails}
            />
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardPage />} path={ROUTES.dashboard} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('demo flow', () => {
  beforeEach(() => {
    clearAuthToken();
    vi.clearAllMocks();
    vi.mocked(infoApi.fetchApiInfo).mockResolvedValue(apiInfoFixture);
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(
      authenticatedUserFixture,
    );
    vi.mocked(dashboardApi.fetchDashboard).mockResolvedValue(
      dashboardViewFixture,
    );
    vi.mocked(incidentApi.fetchIncident).mockResolvedValue(incidentViewFixture);
    vi.mocked(incidentApi.fetchIncidentTimeline).mockResolvedValue(
      timelineFixture,
    );
  });

  it('navigates Home → Login → Dashboard', async () => {
    const user = userEvent.setup();

    vi.mocked(authApi.login).mockResolvedValue({
      accessToken: 'issued-token',
      expiresIn: 3600,
    });

    renderDemoApp(ROUTES.home);

    expect(
      await screen.findByRole('link', { name: 'Iniciar sesión' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Iniciar sesión' }));
    expect(await screen.findByLabelText('Email')).toBeInTheDocument();

    await user.type(
      screen.getByLabelText('Email'),
      'demo@edificios.local',
    );
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }),
    ).toBeInTheDocument();
    expect(dashboardApi.fetchDashboard).toHaveBeenCalled();
  });

  it('navigates Dashboard → Incident detail → Timeline → Dashboard', async () => {
    const user = userEvent.setup();

    setAuthToken('stored-token');
    renderDemoApp(ROUTES.dashboard);

    await waitFor(() => {
      expect(screen.getByText('Incidencias recientes')).toBeInTheDocument();
    });

    await user.click(
      screen.getAllByRole('link', {
        name: dashboardIncidentFixture.description,
      })[0]!,
    );

    expect(
      await screen.findByRole('heading', { name: 'Detalle de incidencia' }),
    ).toBeInTheDocument();
    expect(incidentApi.fetchIncident).toHaveBeenCalledWith(
      dashboardIncidentFixture.id,
    );
    expect(incidentApi.fetchIncidentTimeline).toHaveBeenCalledWith(
      dashboardIncidentFixture.id,
    );

    expect(screen.getByRole('heading', { name: 'Timeline' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Volver al Dashboard' }));

    expect(
      await screen.findByRole('heading', { name: 'Dashboard' }),
    ).toBeInTheDocument();
  });

  it('logs out from sidebar navigation', async () => {
    const user = userEvent.setup();

    setAuthToken('stored-token');
    renderDemoApp(ROUTES.dashboard);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Dashboard' }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    expect(await screen.findByLabelText('Email')).toBeInTheDocument();
    expect(getAuthToken()).toBeNull();
  });

  it('shows dashboard access on Home when session exists', async () => {
    setAuthToken('stored-token');

    renderDemoApp(ROUTES.home);

    expect(
      await screen.findByRole('link', { name: 'Ir al Dashboard' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Iniciar sesión' }),
    ).not.toBeInTheDocument();
  });
});

describe('incident navigation entry points', () => {
  beforeEach(() => {
    clearAuthToken();
    vi.clearAllMocks();
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(
      authenticatedUserFixture,
    );
    vi.mocked(dashboardApi.fetchDashboard).mockResolvedValue(
      dashboardViewFixture,
    );
    vi.mocked(incidentApi.fetchIncident).mockResolvedValue(incidentViewFixture);
    vi.mocked(incidentApi.fetchIncidentTimeline).mockResolvedValue(
      timelineFixture,
    );
  });

  it('opens incident detail from dashboard recent incidents list', async () => {
    const user = userEvent.setup();

    setAuthToken('stored-token');
    renderDemoApp(ROUTES.dashboard);

    await waitFor(() => {
      expect(screen.getByText('Incidencias recientes')).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole('link', { name: 'Ver detalle y timeline' }),
    );

    expect(
      await screen.findByRole('heading', { name: 'Detalle de incidencia' }),
    ).toBeInTheDocument();
  });
});
