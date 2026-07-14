export type IncidentStatus =
  | 'DETECTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED';

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

export type TimelineEntry = {
  timestamp: string;
  type: string;
  description: string;
  actorId: string | null;
};

export type TimelineVisualType =
  | 'EVENT'
  | 'NOTIFICATION'
  | 'WORK_ORDER'
  | 'INCIDENT';
