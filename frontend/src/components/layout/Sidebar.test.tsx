import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { Sidebar } from './Sidebar';
import { ROUTES } from '../../routes/paths';

describe('Sidebar', () => {
  const onClose = vi.fn();
  const onLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderSidebar(initialPath: string = ROUTES.dashboard) {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route
            element={
              <Sidebar
                isAuthenticated
                isOpen
                onClose={onClose}
                onLogout={onLogout}
              />
            }
            path="*"
          />
        </Routes>
      </MemoryRouter>,
    );
  }

  it('renders navigation links for Home, Dashboard, Incidencias and API Docs', () => {
    renderSidebar();

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      ROUTES.home,
    );
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'href',
      ROUTES.dashboard,
    );
    expect(screen.getByRole('link', { name: 'Incidencias' })).toHaveAttribute(
      'href',
      ROUTES.incidents,
    );
    expect(screen.getByRole('link', { name: 'API Docs' })).toHaveAttribute(
      'href',
      ROUTES.apiDocs,
    );
  });

  it('highlights the active route', () => {
    renderSidebar(ROUTES.dashboard);

    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveClass(
      'bg-slate-900',
    );
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveClass(
      'bg-slate-900',
    );
  });

  it('highlights Incidencias on incident detail routes', () => {
    renderSidebar('/incidents/incident-1');

    expect(screen.getByRole('link', { name: 'Incidencias' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('calls logout when Logout is clicked', async () => {
    const user = userEvent.setup();
    renderSidebar();

    await user.click(screen.getByRole('button', { name: 'Logout' }));

    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
