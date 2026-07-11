import { WorkOrderQueryView } from './work-order-query-view';

export type WorkOrderQueryRow = {
  id: string;
  incident_id: string;
  actor_id: string;
  status: string;
  description: string;
  created_at: Date;
};

export function toWorkOrderQueryView(row: WorkOrderQueryRow): WorkOrderQueryView {
  return {
    id: row.id,
    incidentId: row.incident_id,
    actorId: row.actor_id,
    status: row.status,
    description: row.description,
    createdAt: row.created_at.toISOString(),
  };
}
