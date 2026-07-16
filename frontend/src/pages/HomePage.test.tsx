import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import * as authApi from '../api/auth.api';
import * as infoApi from '../api/info.api';
import { AuthProvider } from '../auth/AuthContext';
import { HomePage } from '../pages/HomePage';
import { ROUTES } from '../routes/paths';
import { clearAuthToken, setAuthToken } from '../auth/authToken';
import { apiInfoFixture } from '../test/fixtures/api-info';
import { authenticatedUserFixture } from '../test/fixtures/auth';

vi.mock('../api/auth.api', () => ({
  login: vi.fn(),
  fetchCurrentUser: vi.fn(),
}));

vi.mock('../api/info.api', () => ({
  fetchApiInfo: vi.fn(),
}));

function renderHome(initialPath: string = ROUTES.home) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <Routes>
            <Route element={<HomePage />} path={ROUTES.home} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    clearAuthToken();
    vi.clearAllMocks();
    vi.mocked(infoApi.fetchApiInfo).mockResolvedValue(apiInfoFixture);
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(
      authenticatedUserFixture,
    );
  });

  it('shows login access when there is no session', async () => {
    renderHome();

    expect(
      await screen.findByRole('heading', { name: 'EdificiOS' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('0.18.0-alpha')).toBeInTheDocument();
    expect(screen.getByText('Backend disponible')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Iniciar sesión' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Ir al Dashboard' }),
    ).not.toBeInTheDocument();
  });

  it('shows dashboard access when a session exists', async () => {
    setAuthToken('stored-token');

    renderHome();

    expect(
      await screen.findByRole('link', { name: 'Ir al Dashboard' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Iniciar sesión' }),
    ).not.toBeInTheDocument();
  });
});
