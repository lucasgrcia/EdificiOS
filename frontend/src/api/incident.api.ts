import type { IncidentView, TimelineEntry } from '../types/incident';
import { publicApiClient } from './client';

export async function fetchIncident(incidentId: string): Promise<IncidentView> {
  const response = await publicApiClient.get<IncidentView>(
    `/operations/incidents/${incidentId}`,
  );

  return response.data;
}

export async function fetchIncidentTimeline(
  incidentId: string,
): Promise<TimelineEntry[]> {
  const response = await publicApiClient.get<TimelineEntry[]>(
    `/operations/incidents/${incidentId}/timeline`,
  );

  return response.data;
}
