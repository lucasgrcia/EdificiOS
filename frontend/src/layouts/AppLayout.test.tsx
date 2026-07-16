import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import * as authApi from '../api/auth.api';
import { AuthProvider } from '../auth/AuthContext';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { AppLayout } from './AppLayout';
import { clearAuthToken, getAuthToken, setAuthToken } from '../auth/authToken';
import { LoginPage } from '../pages/LoginPage';
import { ROUTES } from '../routes/paths';
import { authenticatedUserFixture } from '../test/fixtures/auth';

vi.mock('../api/auth.api', () => ({
  login: vi.fn(),
  fetchCurrentUser: vi.fn(),
}));

function ProtectedContent() {
  return (
    <AppLayout>
      <div>Protected content</div>
    </AppLayout>
  );
}

function renderProtectedApp(initialPath: string, queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthProvider>
          <Routes>
            <Route element={<LoginPage />} path={ROUTES.login} />
            <Route element={<ProtectedRoute />}>
              <Route element={<ProtectedContent />} path={ROUTES.dashboard} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AppLayout', () => {
  beforeEach(() => {
    clearAuthToken();
    vi.clearAllMocks();
    vi.mocked(authApi.fetchCurrentUser).mockResolvedValue(
      authenticatedUserFixture,
    );
  });

  it('clears session, query cache and redirects to login on logout', async () => {
    const user = userEvent.setup();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    setAuthToken('stored-token');
    queryClient.setQueryData(['dashboard', null], { cached: true });

    renderProtectedApp(ROUTES.dashboard, queryClient);

    await waitFor(() => {
      expect(screen.getByText('Protected content')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => {
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    expect(getAuthToken()).toBeNull();
    expect(queryClient.getQueryData(['dashboard', null])).toBeUndefined();
  });
});
