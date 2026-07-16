import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Header } from './Header';
import { authenticatedUserFixture } from '../../test/fixtures/auth';

describe('Header', () => {
  it('shows authenticated user name and email', () => {
    render(
      <Header
        isAuthenticated
        onMenuClick={() => undefined}
        user={authenticatedUserFixture}
      />,
    );

    expect(screen.getByText(authenticatedUserFixture.displayName)).toBeInTheDocument();
    expect(screen.getByText(authenticatedUserFixture.email)).toBeInTheDocument();
    expect(screen.getByLabelText('Sesión activa')).toBeInTheDocument();
  });

  it('does not show user details when unauthenticated', () => {
    render(
      <Header
        isAuthenticated={false}
        onMenuClick={() => undefined}
        user={null}
      />,
    );

    expect(
      screen.queryByText(authenticatedUserFixture.displayName),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Sesión activa')).not.toBeInTheDocument();
  });
});
