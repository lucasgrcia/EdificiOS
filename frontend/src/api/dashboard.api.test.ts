import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchDashboard } from './dashboard.api';
import { authenticatedApiClient } from './client';
import { dashboardViewFixture } from '../test/fixtures/dashboard';

vi.mock('./client', () => ({
  authenticatedApiClient: {
    get: vi.fn(),
  },
  publicApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

describe('fetchDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authenticatedApiClient.get).mockResolvedValue({
      data: dashboardViewFixture,
    });
  });

  it('sends actorId query param when actorId is provided', async () => {
    const actorId = '00000000-0000-0000-0000-000000000020';

    await fetchDashboard({ actorId });

    expect(authenticatedApiClient.get).toHaveBeenCalledWith(
      '/operations/dashboard',
      { params: { actorId } },
    );
  });

  it('omits query params when actorId is not provided', async () => {
    await fetchDashboard();

    expect(authenticatedApiClient.get).toHaveBeenCalledWith(
      '/operations/dashboard',
      { params: undefined },
    );
  });

  it('omits query params when actorId is empty', async () => {
    await fetchDashboard({ actorId: '   ' });

    expect(authenticatedApiClient.get).toHaveBeenCalledWith(
      '/operations/dashboard',
      { params: undefined },
    );
  });
});
