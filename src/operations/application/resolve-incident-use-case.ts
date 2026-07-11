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

export type ResolveIncidentCommand = {
  incidentId: string;
};

const INCIDENT_RESOLVED_NOTIFICATION_TYPE = 'INCIDENT_RESOLVED';
const INCIDENT_RESOLVED_NOTIFICATION_CHANNEL = 'IN_APP';
const INCIDENT_RESOLVED_NOTIFICATION_MESSAGE =
  'La incidencia fue resuelta correctamente.';

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

        await persistIncidentTransition(
          transaction,
          incident,
          updatedRecord,
          eventId,
          outboxId,
          resolvedAt,
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

    return result;
  }
}
