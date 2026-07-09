import { IncidentAggregate } from '../domain/incident';
import {
  IncidentTransitionResult,
  OutboxRecord,
  UseCaseDependencies,
} from './incident-persistence';
import { toFlowEventRecord } from './map-incident-domain-event';
import { pullExactlyOneDomainEvent } from './pull-exactly-one-domain-event';

export type DetectIncidentCommand = {
  description: string;
};

export type DetectIncidentUseCaseDependencies = UseCaseDependencies;

export class DetectIncidentUseCase {
  constructor(private readonly dependencies: DetectIncidentUseCaseDependencies) {}

  async execute(
    command: DetectIncidentCommand,
  ): Promise<IncidentTransitionResult> {
    return this.dependencies.transactionRunner.run(async (transaction) => {
      const incidentId = this.dependencies.idGenerator.generate();
      const eventId = this.dependencies.idGenerator.generate();
      const outboxId = this.dependencies.idGenerator.generate();
      const detectedAt = this.dependencies.clock.now();

      const incident = IncidentAggregate.detect({
        incidentId,
        flowId: eventId,
        description: command.description,
        detectedAt,
      });
      const event = pullExactlyOneDomainEvent(incident);
      const flow = toFlowEventRecord(event);

      const outbox: OutboxRecord = {
        id: outboxId,
        aggregateType: flow.aggregateType,
        aggregateId: flow.aggregateId,
        eventId: flow.id,
        payload: flow,
        status: 'pending',
        createdAt: incident.detectedAt,
      };

      await transaction.incidents.save({
        id: incident.id,
        description: incident.description,
        currentProjectionState: {
          status: 'DETECTED',
          description: incident.description,
          detectedAt: incident.detectedAt.toISOString(),
        },
        createdAt: incident.detectedAt,
      });
      await transaction.events.save(flow);
      await transaction.outbox.save(outbox);

      return {
        incidentId,
        eventId,
        outboxId,
      };
    });
  }
}
