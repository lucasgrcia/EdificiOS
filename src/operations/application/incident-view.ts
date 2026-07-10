import { IncidentStatus } from '../domain/incident';

export type IncidentView = {
  id: string;
  description: string;
  status: IncidentStatus;
  detectedAt: string;
  assetId: string;
  shiftId: string;
  actorId: string;
  assignedAt: string | null;
  assignedActorId: string | null;
  startedAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
};
