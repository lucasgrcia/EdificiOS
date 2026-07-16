import { useQuery } from '@tanstack/react-query';

import { fetchIncident } from '../api/incident.api';
import { isNonEmptyString } from '../utils/isNonEmptyString';

export function useIncident(incidentId: string | undefined) {
  return useQuery({
    queryKey: ['incident', incidentId ?? null],
    enabled: isNonEmptyString(incidentId),
    queryFn: () => fetchIncident(incidentId as string),
  });
}
