import { useQuery } from '@tanstack/react-query';

import { fetchIncidentTimeline } from '../api/incident.api';

export function useIncidentTimeline(incidentId: string | undefined) {
  return useQuery({
    queryKey: ['incident-timeline', incidentId ?? null],
    enabled: incidentId !== undefined && incidentId.trim() !== '',
    queryFn: () => fetchIncidentTimeline(incidentId as string),
  });
}
