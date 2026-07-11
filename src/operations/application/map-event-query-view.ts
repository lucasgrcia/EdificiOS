import { EventQueryView } from './event-query-view';

export type EventQueryRow = {
  id: string;
  incident_id: string;
  name: string;
  actor_id: string | null;
  occurred_at: Date;
};

export function toEventQueryView(row: EventQueryRow): EventQueryView {
  return {
    id: row.id,
    incidentId: row.incident_id,
    name: row.name,
    occurredAt: row.occurred_at.toISOString(),
    actorId: row.actor_id,
  };
}
