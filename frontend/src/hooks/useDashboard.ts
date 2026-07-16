import { useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchDashboard } from '../api/dashboard.api';

type UseDashboardOptions = {
  actorId?: string;
  preferCache?: boolean;
};

export function useDashboard(options?: UseDashboardOptions) {
  const actorId = options?.actorId;
  const queryClient = useQueryClient();
  const queryKey = ['dashboard', actorId ?? null];
  const hasCachedData = queryClient.getQueryData(queryKey) !== undefined;

  return useQuery({
    queryKey,
    queryFn: () =>
      fetchDashboard(actorId !== undefined ? { actorId } : undefined),
    refetchOnMount: options?.preferCache === true && hasCachedData ? false : true,
  });
}
