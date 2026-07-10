import { AssetId } from '../domain/asset/value-objects/asset-id';
import { AssetNotFoundError } from '../domain/asset/asset-not-found';
import { IncidentAggregate } from '../domain/incident';
import { AssetRepository } from './asset-persistence';
import {
  IncidentTransitionResult,
  OutboxRecord,
  UseCaseDependencies,
} from './incident-persistence';
import { toFlowEventRecord } from './map-incident-domain-event';
import { pullExactlyOneDomainEvent } from './pull-exactly-one-domain-event';

export type DetectIncidentCommand = {
  assetId: string;
  description: string;
};

export type DetectIncidentUseCaseDependencies = UseCaseDependencies & {
  assetRepository: AssetRepository;
};

export class DetectIncidentUseCase {
  constructor(private readonly dependencies: DetectIncidentUseCaseDependencies) {}

  async execute(
    command: DetectIncidentCommand,
  ): Promise<IncidentTransitionResult> {
    const assetRecord = await this.dependencies.assetRepository.findById(
      command.assetId,
    );

    if (assetRecord === null) {
      throw new AssetNotFoundError(command.assetId);
    }

    const assetId = AssetId.create(assetRecord.id);

    return this.dependencies.transactionRunner.run(async (transaction) => {
      const incidentId = this.dependencies.idGenerator.generate();
      const eventId = this.dependencies.idGenerator.generate();
      const outboxId = this.dependencies.idGenerator.generate();
      const detectedAt = this.dependencies.clock.now();

      const incident = IncidentAggregate.detect({
        incidentId,
        flowId: eventId,
        assetId,
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
          assetId: assetId.toString(),
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
