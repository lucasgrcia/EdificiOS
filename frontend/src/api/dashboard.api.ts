import type { DashboardView } from '../types/dashboard';
import { authenticatedApiClient } from './client';

type FetchDashboardParams = {
  actorId?: string;
};

export async function fetchDashboard(
  params?: FetchDashboardParams,
): Promise<DashboardView> {
  const actorId = params?.actorId?.trim();

  const response = await authenticatedApiClient.get<DashboardView>(
    '/operations/dashboard',
    {
      params: actorId !== undefined && actorId.length > 0 ? { actorId } : undefined,
    },
  );

  return response.data;
}
