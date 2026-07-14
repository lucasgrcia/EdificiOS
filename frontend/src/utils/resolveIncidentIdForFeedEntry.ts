import type { ActivityFeedEntry, DashboardIncidentRef } from '../types/dashboard';

export function resolveIncidentIdForFeedEntry(
  entry: ActivityFeedEntry,
  incidents: DashboardIncidentRef[],
): string | undefined {
  if (entry.type !== 'INCIDENT') {
    return undefined;
  }

  const match = incidents.find((incident) => {
    const sameDescription = incident.description === entry.description;
    const sameActor = incident.actorId === entry.actorId;
    const sameTimestamp =
      incident.detectedAt === entry.timestamp ||
      new Date(incident.detectedAt).getTime() ===
        new Date(entry.timestamp).getTime();

    return sameDescription && sameActor && sameTimestamp;
  });

  return match?.id;
}
