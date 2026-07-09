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

export function toFlowEventRecord(event: IncidentDomainEvent): FlowEventRecord {
  if (event instanceof IncidentDetected) {
    return toDetectedFlowEventRecord(event);
  }

  if (event instanceof IncidentAssigned) {
    return toAssignedFlowEventRecord(event);
  }

  if (event instanceof IncidentInProgress) {
    return toInProgressFlowEventRecord(event);
  }

  if (event instanceof IncidentResolved) {
    return toResolvedFlowEventRecord(event);
  }

  throw new Error('Unsupported incident domain event.');
}

function toDetectedFlowEventRecord(
  event: IncidentDetected,
): DetectedFlowEventRecord {
  return {
    id: event.id,
    aggregateType: 'Incident',
    aggregateId: event.incidentId,
    incidentId: event.incidentId,
    name: event.name,
    schemaVersion: 1,
    correlationId: null,
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
): AssignedFlowEventRecord {
  return {
    id: event.id,
    aggregateType: 'Incident',
    aggregateId: event.incidentId,
    incidentId: event.incidentId,
    name: event.name,
    schemaVersion: 1,
    correlationId: null,
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
): InProgressFlowEventRecord {
  return {
    id: event.id,
    aggregateType: 'Incident',
    aggregateId: event.incidentId,
    incidentId: event.incidentId,
    name: event.name,
    schemaVersion: 1,
    correlationId: null,
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
): ResolvedFlowEventRecord {
  return {
    id: event.id,
    aggregateType: 'Incident',
    aggregateId: event.incidentId,
    incidentId: event.incidentId,
    name: event.name,
    schemaVersion: 1,
    correlationId: null,
    causationId: null,
    actorId: null,
    payload: {
      incidentId: event.incidentId,
      resolvedAt: event.resolvedAt.toISOString(),
    },
    occurredAt: event.occurredAt,
  };
}
