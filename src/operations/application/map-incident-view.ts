import { IncidentProjectionState } from './incident-persistence';
import { IncidentView } from './incident-view';

export type IncidentQueryRow = {
  id: string;
  description: string;
  current_projection_state: IncidentProjectionState;
  created_at: Date;
};

export function toIncidentView(row: IncidentQueryRow): IncidentView {
  const projection = row.current_projection_state;

  return {
    id: row.id,
    description: row.description,
    status: projection.status,
    detectedAt: projection.detectedAt,
    assetId: projection.assetId,
    shiftId: projection.shiftId,
    actorId: projection.actorId,
    assignedAt: projection.assignedAt ?? null,
    assignedActorId: projection.assignedActorId ?? null,
    startedAt: projection.startedAt ?? null,
    resolvedAt: projection.resolvedAt ?? null,
    createdAt: row.created_at.toISOString(),
  };
}
