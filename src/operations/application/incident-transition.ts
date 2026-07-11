import { ActorId } from '../domain/actor/value-objects/actor-id';
import { AssetId } from '../domain/asset/value-objects/asset-id';
import { ShiftId } from '../domain/shift/value-objects/shift-id';
import { IncidentAggregate } from '../domain/incident';
import {
  IncidentRecord,
  OutboxRecord,
  UseCaseDependencies,
} from './incident-persistence';
import { toFlowEventRecord } from './map-incident-domain-event';
import { pullExactlyOneDomainEvent } from './pull-exactly-one-domain-event';

export function rehydrateIncident(record: IncidentRecord): IncidentAggregate {
  return IncidentAggregate.rehydrate({
    incidentId: record.id,
    assetId: AssetId.create(record.currentProjectionState.assetId),
    shiftId: ShiftId.create(record.currentProjectionState.shiftId),
    actorId: ActorId.create(record.currentProjectionState.actorId),
    description: record.description,
    detectedAt: new Date(record.currentProjectionState.detectedAt),
    status: record.currentProjectionState.status,
  });
}

export async function persistIncidentTransition(
  transaction: {
    incidents: {
      updateProjection(incident: IncidentRecord): Promise<void>;
    };
    events: { save(event: ReturnType<typeof toFlowEventRecord>): Promise<void> };
    outbox: { save(outbox: OutboxRecord): Promise<void> };
  },
  incident: IncidentAggregate,
  record: IncidentRecord,
  eventId: string,
  outboxId: string,
  occurredAt: Date,
  correlationId: string | null,
): Promise<void> {
  const event = pullExactlyOneDomainEvent(incident);
  const flow = toFlowEventRecord(event, correlationId);

  const outbox: OutboxRecord = {
    id: outboxId,
    aggregateType: flow.aggregateType,
    aggregateId: flow.aggregateId,
    eventId: flow.id,
    correlationId,
    payload: flow,
    status: 'pending',
    createdAt: occurredAt,
  };

  await transaction.incidents.updateProjection(record);
  await transaction.events.save(flow);
  await transaction.outbox.save(outbox);
}

export type IncidentUseCaseDependencies = UseCaseDependencies;
