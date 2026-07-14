import { useQuery } from '@tanstack/react-query';

import { fetchIncident } from '../api/incident.api';

export function useIncident(incidentId: string | undefined) {
  return useQuery({
    queryKey: ['incident', incidentId ?? null],
    enabled: incidentId !== undefined && incidentId.trim() !== '',
    queryFn: () => fetchIncident(incidentId as string),
  });
}
