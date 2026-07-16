import { useQuery } from '@tanstack/react-query';

import { fetchIncidentTimeline } from '../api/incident.api';
import { isNonEmptyString } from '../utils/isNonEmptyString';

export function useIncidentTimeline(incidentId: string | undefined) {
  return useQuery({
    queryKey: ['incident-timeline', incidentId ?? null],
    enabled: isNonEmptyString(incidentId),
    queryFn: () => fetchIncidentTimeline(incidentId as string),
  });
}
