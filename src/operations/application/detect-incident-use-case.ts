import { ActorId } from '../domain/actor/value-objects/actor-id';
import { AssetId } from '../domain/asset/value-objects/asset-id';
import { AssetNotFoundError } from '../domain/asset/asset-not-found';
import { IncidentAggregate } from '../domain/incident';
import { MultipleActiveShiftsError } from '../domain/shift/multiple-active-shifts';
import { NoActiveShiftError } from '../domain/shift/no-active-shift';
import { ShiftId } from '../domain/shift/value-objects/shift-id';
import { AssetRepository } from './asset-persistence';
import {
  CreateNotificationCommand,
  CreateNotificationResult,
} from './create-notification-use-case';
import {
  IncidentProjectionState,
  IncidentTransitionResult,
  OutboxRecord,
  UseCaseDependencies,
} from './incident-persistence';
import { toFlowEventRecord } from './map-incident-domain-event';
import { pullExactlyOneDomainEvent } from './pull-exactly-one-domain-event';
import { ShiftRepository } from './shift-persistence';

export type DetectIncidentCommand = {
  assetId: string;
  description: string;
};

const INCIDENT_DETECTED_NOTIFICATION_TYPE = 'INCIDENT_DETECTED';
const INCIDENT_DETECTED_NOTIFICATION_CHANNEL = 'IN_APP';
const INCIDENT_DETECTED_NOTIFICATION_MESSAGE =
  'Se detectó una nueva incidencia.';

export type DetectIncidentUseCaseDependencies = UseCaseDependencies & {
  assetRepository: AssetRepository;
  shiftRepository: ShiftRepository;
  createNotificationUseCase: {
    execute(command: CreateNotificationCommand): Promise<CreateNotificationResult>;
  };
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

    const activeShifts = await this.dependencies.shiftRepository.findActiveBySite(
      assetRecord.siteId,
    );

    if (activeShifts.length === 0) {
      throw new NoActiveShiftError(assetRecord.siteId);
    }

    if (activeShifts.length > 1) {
      throw new MultipleActiveShiftsError(assetRecord.siteId);
    }

    const assetId = AssetId.create(assetRecord.id);
    const shiftId = ShiftId.create(activeShifts[0].id);
    const actorId = ActorId.create(activeShifts[0].actorId);

    const result = await this.dependencies.transactionRunner.run(
      async (transaction) => {
      const incidentId = this.dependencies.idGenerator.generate();
      const eventId = this.dependencies.idGenerator.generate();
      const outboxId = this.dependencies.idGenerator.generate();
      const detectedAt = this.dependencies.clock.now();

      const incident = IncidentAggregate.detect({
        incidentId,
        flowId: eventId,
        assetId,
        shiftId,
        actorId,
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

      const currentProjectionState: IncidentProjectionState = {
        status: 'DETECTED',
        description: incident.description,
        detectedAt: incident.detectedAt.toISOString(),
        assetId: assetId.toString(),
        shiftId: shiftId.toString(),
        actorId: actorId.toString(),
      };

      await transaction.incidents.save({
        id: incident.id,
        description: incident.description,
        currentProjectionState,
        createdAt: incident.detectedAt,
      });
      await transaction.events.save(flow);
      await transaction.outbox.save(outbox);

      return {
        incidentId,
        eventId,
        outboxId,
        recipientId:
          currentProjectionState.assignedActorId ??
          currentProjectionState.actorId,
      };
    },
    );

    await this.dependencies.createNotificationUseCase.execute({
      recipientId: result.recipientId,
      type: INCIDENT_DETECTED_NOTIFICATION_TYPE,
      channel: INCIDENT_DETECTED_NOTIFICATION_CHANNEL,
      message: INCIDENT_DETECTED_NOTIFICATION_MESSAGE,
    });

    return {
      incidentId: result.incidentId,
      eventId: result.eventId,
      outboxId: result.outboxId,
    };
  }
}
