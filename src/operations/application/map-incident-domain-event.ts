import { IncidentDomainEvent } from '../domain/incident';
import { IncidentAssigned } from '../domain/incident-assigned';
import { IncidentDetected } from '../domain/incident-detected';
import { IncidentInProgress } from '../domain/incident-in-progress';
import { IncidentResolved } from '../domain/incident-resolved';
import {
  AssignedFlowEventRecord,
  DetectedFlowEventRecord,
  FlowEventRecord,
  InProgressFlowEventRecord,
  ResolvedFlowEventRecord,
} from './incident-persistence';

export function toFlowEventRecord(
  event: IncidentDomainEvent,
  correlationId: string | null,
): FlowEventRecord {
  if (event instanceof IncidentDetected) {
    return toDetectedFlowEventRecord(event, correlationId);
  }

  if (event instanceof IncidentAssigned) {
    return toAssignedFlowEventRecord(event, correlationId);
  }

  if (event instanceof IncidentInProgress) {
    return toInProgressFlowEventRecord(event, correlationId);
  }

  if (event instanceof IncidentResolved) {
    return toResolvedFlowEventRecord(event, correlationId);
  }

  throw new Error('Unsupported incident domain event.');
}

function toDetectedFlowEventRecord(
  event: IncidentDetected,
  correlationId: string | null,
): DetectedFlowEventRecord {
  return {
    id: event.id,
    aggregateType: 'Incident',
    aggregateId: event.incidentId,
    incidentId: event.incidentId,
    name: event.name,
    schemaVersion: 1,
    correlationId,
    causationId: null,
    actorId: null,
    payload: {
      incidentId: event.incidentId,
      description: event.description,
      detectedAt: event.detectedAt.toISOString(),
    },
    occurredAt: event.occurredAt,
  };
}

function toAssignedFlowEventRecord(
  event: IncidentAssigned,
  correlationId: string | null,
): AssignedFlowEventRecord {
  return {
    id: event.id,
    aggregateType: 'Incident',
    aggregateId: event.incidentId,
    incidentId: event.incidentId,
    name: event.name,
    schemaVersion: 1,
    correlationId,
    causationId: null,
    actorId: event.actorId,
    payload: {
      incidentId: event.incidentId,
      actorId: event.actorId,
      assignedAt: event.assignedAt.toISOString(),
    },
    occurredAt: event.occurredAt,
  };
}

function toInProgressFlowEventRecord(
  event: IncidentInProgress,
  correlationId: string | null,
): InProgressFlowEventRecord {
  return {
    id: event.id,
    aggregateType: 'Incident',
    aggregateId: event.incidentId,
    incidentId: event.incidentId,
    name: event.name,
    schemaVersion: 1,
    correlationId,
    causationId: null,
    actorId: null,
    payload: {
      incidentId: event.incidentId,
      startedAt: event.startedAt.toISOString(),
    },
    occurredAt: event.occurredAt,
  };
}

function toResolvedFlowEventRecord(
  event: IncidentResolved,
  correlationId: string | null,
): ResolvedFlowEventRecord {
  return {
    id: event.id,
    aggregateType: 'Incident',
    aggregateId: event.incidentId,
    incidentId: event.incidentId,
    name: event.name,
    schemaVersion: 1,
    correlationId,
    causationId: null,
    actorId: null,
    payload: {
      incidentId: event.incidentId,
      resolvedAt: event.resolvedAt.toISOString(),
    },
    occurredAt: event.occurredAt,
  };
}
