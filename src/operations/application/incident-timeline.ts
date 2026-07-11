export type TimelineEntryView = {
  timestamp: string;
  type: string;
  description: string;
  actorId: string | null;
};

export type IncidentTimelineView = {
  incidentId: string;
  entries: TimelineEntryView[];
};

export interface IncidentTimelineRepository {
  findTimelineByIncidentId(incidentId: string): Promise<IncidentTimelineView>;
}
