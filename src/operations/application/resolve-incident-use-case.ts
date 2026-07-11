import {
  CreateNotificationCommand,
  CreateNotificationResult,
} from './create-notification-use-case';
import {
  IncidentTransitionResult,
  UseCaseDependencies,
} from './incident-persistence';
import {
  persistIncidentTransition,
  rehydrateIncident,
} from './incident-transition';
import {
  INCIDENT_RESOLVE_FAILURE_METRIC,
  INCIDENT_RESOLVE_SUCCESS_METRIC,
} from '../../shared/metrics/metrics-view';

export type ResolveIncidentCommand = {
  incidentId: string;
};

const INCIDENT_RESOLVED_NOTIFICATION_TYPE = 'INCIDENT_RESOLVED';
const INCIDENT_RESOLVED_NOTIFICATION_CHANNEL = 'IN_APP';
const INCIDENT_RESOLVED_NOTIFICATION_MESSAGE =
  'La incidencia fue resuelta correctamente.';
const STARTED_MESSAGE = 'ResolveIncidentUseCase started';
const COMPLETED_MESSAGE = 'ResolveIncidentUseCase completed';
const FAILED_MESSAGE = 'ResolveIncidentUseCase failed';

export type ResolveIncidentUseCaseDependencies = UseCaseDependencies & {
  createNotificationUseCase: {
    execute(command: CreateNotificationCommand): Promise<CreateNotificationResult>;
  };
};

export class ResolveIncidentUseCase {
  constructor(
    private readonly dependencies: ResolveIncidentUseCaseDependencies,
  ) {}

  async execute(
    command: ResolveIncidentCommand,
  ): Promise<IncidentTransitionResult> {
    this.dependencies.logger.info(STARTED_MESSAGE);

    try {
      let recipientId = '';

      const result = await this.dependencies.transactionRunner.run(
        async (transaction) => {
          const record = await transaction.incidents.findById(command.incidentId);

          if (record === null) {
            throw new Error('Incident not found.');
          }

          recipientId =
            record.currentProjectionState.assignedActorId ??
            record.currentProjectionState.actorId;

          const eventId = this.dependencies.idGenerator.generate();
          const outboxId = this.dependencies.idGenerator.generate();
          const resolvedAt = this.dependencies.clock.now();
          const incident = rehydrateIncident(record);

          incident.resolve({
            flowId: eventId,
            resolvedAt,
          });

          const updatedRecord = {
            ...record,
            currentProjectionState: {
              ...record.currentProjectionState,
              status: incident.currentStatus,
              resolvedAt: resolvedAt.toISOString(),
            },
          };

          const correlationId = this.dependencies.correlationIdProvider.get();

          await persistIncidentTransition(
            transaction,
            incident,
            updatedRecord,
            eventId,
            outboxId,
            resolvedAt,
            correlationId,
          );

          return {
            incidentId: command.incidentId,
            eventId,
            outboxId,
          };
        },
      );

      await this.dependencies.createNotificationUseCase.execute({
        recipientId,
        type: INCIDENT_RESOLVED_NOTIFICATION_TYPE,
        channel: INCIDENT_RESOLVED_NOTIFICATION_CHANNEL,
        message: INCIDENT_RESOLVED_NOTIFICATION_MESSAGE,
      });

      this.dependencies.logger.info(COMPLETED_MESSAGE);
      this.dependencies.metrics.increment(INCIDENT_RESOLVE_SUCCESS_METRIC);

      return result;
    } catch (error) {
      this.dependencies.logger.error(FAILED_MESSAGE);
      this.dependencies.metrics.increment(INCIDENT_RESOLVE_FAILURE_METRIC);
      throw error;
    }
  }
}
