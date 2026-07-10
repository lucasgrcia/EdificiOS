import { IncidentStatus } from '../domain/incident';
import { INCIDENT_ASSIGNED_EVENT_NAME } from '../domain/incident-assigned';
import { INCIDENT_DETECTED_EVENT_NAME } from '../domain/incident-detected';
import { INCIDENT_IN_PROGRESS_EVENT_NAME } from '../domain/incident-in-progress';
import { INCIDENT_RESOLVED_EVENT_NAME } from '../domain/incident-resolved';

export type IncidentProjectionState = {
  status: IncidentStatus;
  description: string;
  detectedAt: string;
  assetId: string;
  assignedAt?: string;
  assignedActorId?: string;
  startedAt?: string;
  resolvedAt?: string;
};

export type IncidentRecord = {
  id: string;
  description: string;
  currentProjectionState: IncidentProjectionState;
  createdAt: Date;
};

export type DetectedFlowEventRecord = {
  id: string;
  aggregateType: 'Incident';
  aggregateId: string;
  incidentId: string;
  name: typeof INCIDENT_DETECTED_EVENT_NAME;
  schemaVersion: 1;
  correlationId: string | null;
  causationId: string | null;
  actorId: string | null;
  payload: {
    incidentId: string;
    description: string;
    detectedAt: string;
  };
  occurredAt: Date;
};

export type AssignedFlowEventRecord = {
  id: string;
  aggregateType: 'Incident';
  aggregateId: string;
  incidentId: string;
  name: typeof INCIDENT_ASSIGNED_EVENT_NAME;
  schemaVersion: 1;
  correlationId: string | null;
  causationId: string | null;
  actorId: string | null;
  payload: {
    incidentId: string;
    actorId: string;
    assignedAt: string;
  };
  occurredAt: Date;
};

export type InProgressFlowEventRecord = {
  id: string;
  aggregateType: 'Incident';
  aggregateId: string;
  incidentId: string;
  name: typeof INCIDENT_IN_PROGRESS_EVENT_NAME;
  schemaVersion: 1;
  correlationId: string | null;
  causationId: string | null;
  actorId: string | null;
  payload: {
    incidentId: string;
    startedAt: string;
  };
  occurredAt: Date;
};

export type ResolvedFlowEventRecord = {
  id: string;
  aggregateType: 'Incident';
  aggregateId: string;
  incidentId: string;
  name: typeof INCIDENT_RESOLVED_EVENT_NAME;
  schemaVersion: 1;
  correlationId: string | null;
  causationId: string | null;
  actorId: string | null;
  payload: {
    incidentId: string;
    resolvedAt: string;
  };
  occurredAt: Date;
};

export type FlowEventRecord =
  | DetectedFlowEventRecord
  | AssignedFlowEventRecord
  | InProgressFlowEventRecord
  | ResolvedFlowEventRecord;

export type OutboxRecord = {
  id: string;
  aggregateType: 'Incident';
  aggregateId: string;
  eventId: string;
  payload: FlowEventRecord;
  status: 'pending';
  createdAt: Date;
};

export type IncidentTransitionResult = {
  incidentId: string;
  eventId: string;
  outboxId: string;
};

export interface IncidentRepository {
  save(incident: IncidentRecord): Promise<void>;
  findById(id: string): Promise<IncidentRecord | null>;
  updateProjection(incident: IncidentRecord): Promise<void>;
}

export interface FlowEventRepository {
  save(event: FlowEventRecord): Promise<void>;
}

export interface OutboxRepository {
  save(outbox: OutboxRecord): Promise<void>;
}

export interface Transaction {
  incidents: IncidentRepository;
  events: FlowEventRepository;
  outbox: OutboxRepository;
}

export interface TransactionRunner {
  run<T>(work: (transaction: Transaction) => Promise<T>): Promise<T>;
}

export interface IdGenerator {
  generate(): string;
}

export interface Clock {
  now(): Date;
}

export type UseCaseDependencies = {
  transactionRunner: TransactionRunner;
  idGenerator: IdGenerator;
  clock: Clock;
};
