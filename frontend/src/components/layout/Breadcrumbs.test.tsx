import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { Breadcrumbs } from './Breadcrumbs';
import { ROUTES } from '../../routes/paths';

function renderBreadcrumbs(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Breadcrumbs />
    </MemoryRouter>,
  );
}

describe('Breadcrumbs', () => {
  it('renders a single breadcrumb on dashboard', () => {
    renderBreadcrumbs(ROUTES.dashboard);

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent(
      'Dashboard',
    );
    expect(screen.getByText('Dashboard')).toHaveAttribute('aria-current', 'page');
  });

  it('renders dashboard and incident breadcrumbs on incident detail', () => {
    renderBreadcrumbs('/incidents/incident-1');

    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'href',
      ROUTES.dashboard,
    );
    expect(screen.getByText('Incidencia')).toHaveAttribute('aria-current', 'page');
  });
});
