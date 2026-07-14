import { useQuery } from '@tanstack/react-query';

import { fetchDashboard } from '../api/dashboard.api';

type UseDashboardOptions = {
  actorId?: string;
};

export function useDashboard(options?: UseDashboardOptions) {
  const actorId = options?.actorId;

  return useQuery({
    queryKey: ['dashboard', actorId ?? null],
    queryFn: () => fetchDashboard(actorId !== undefined ? { actorId } : undefined),
  });
}
