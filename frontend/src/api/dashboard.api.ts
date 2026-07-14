import type { DashboardView } from '../types/dashboard';
import { publicApiClient } from './client';

type FetchDashboardParams = {
  actorId?: string;
};

export async function fetchDashboard(
  params?: FetchDashboardParams,
): Promise<DashboardView> {
  const response = await publicApiClient.get<DashboardView>(
    '/operations/dashboard',
    {
      params:
        params?.actorId !== undefined ? { actorId: params.actorId } : undefined,
    },
  );

  return response.data;
}
