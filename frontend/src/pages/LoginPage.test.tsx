import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import * as authApi from '../api/auth.api';
import { AuthProvider } from '../auth/AuthContext';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { ROUTES } from '../routes/paths';
import { clearAuthToken } from '../auth/authToken';
import {
  authenticatedUserFixture,
  createUnauthorizedAxiosError,
} from '../test/fixtures/auth';
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

function renderLoginFlow(initialPath: string = ROUTES.login) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <Routes>
            <Route element={<LoginPage />} path={ROUTES.login} />
            <Route element={<ProtectedRoute />}>
              <Route
                element={<div>Dashboard content</div>}
                path={ROUTES.dashboard}
              />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    clearAuthToken();
    vi.clearAllMocks();
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(
      authenticatedUserFixture,
    );
  });

  it('redirects to dashboard after a successful login', async () => {
    const user = userEvent.setup();

    vi.mocked(authApi.login).mockResolvedValue({
      accessToken: 'issued-token',
      expiresIn: 3600,
    });

    renderLoginFlow();

    await user.type(
      screen.getByLabelText('Email'),
      'demo@edificios.local',
    );
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByText('Dashboard content')).toBeInTheDocument();
    expect(authApi.login).toHaveBeenCalledWith({
      email: 'demo@edificios.local',
    });
    expect(authApi.fetchCurrentUser).toHaveBeenCalled();
  });

  it('shows an error card when login returns 401', async () => {
    const user = userEvent.setup();

    vi.mocked(authApi.login).mockRejectedValue(createUnauthorizedAxiosError());

    renderLoginFlow();

    await user.type(
      screen.getByLabelText('Email'),
      'missing@edificios.local',
    );
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Unauthorized');
    expect(screen.queryByText('Dashboard content')).not.toBeInTheDocument();
    expect(toastStore.toast.error).not.toHaveBeenCalledWith(
      'La sesión expiró. Inicia sesión nuevamente.',
    );
  });
});

describe('ProtectedRoute', () => {
  beforeEach(() => {
    clearAuthToken();
    vi.clearAllMocks();
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(
      authenticatedUserFixture,
    );
  });

  it('redirects unauthenticated users to login', async () => {
    renderLoginFlow(ROUTES.dashboard);

    expect(await screen.findByLabelText('Email')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard content')).not.toBeInTheDocument();
  });

  it('allows authenticated users to access protected routes', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      accessToken: 'issued-token',
      expiresIn: 3600,
    });

    const user = userEvent.setup();
    renderLoginFlow(ROUTES.dashboard);

    await user.type(
      screen.getByLabelText('Email'),
      'demo@edificios.local',
    );
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByText('Dashboard content')).toBeInTheDocument();
  });
});
