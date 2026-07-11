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

export type AssignIncidentCommand = {
  incidentId: string;
  actorId: string;
};

const INCIDENT_ASSIGNED_NOTIFICATION_TYPE = 'INCIDENT_ASSIGNED';
const INCIDENT_ASSIGNED_NOTIFICATION_CHANNEL = 'IN_APP';
const INCIDENT_ASSIGNED_NOTIFICATION_MESSAGE = 'Se te asignó una incidencia.';

export type AssignIncidentUseCaseDependencies = UseCaseDependencies & {
  createNotificationUseCase: {
    execute(command: CreateNotificationCommand): Promise<CreateNotificationResult>;
  };
};

export class AssignIncidentUseCase {
  constructor(
    private readonly dependencies: AssignIncidentUseCaseDependencies,
  ) {}

  async execute(
    command: AssignIncidentCommand,
  ): Promise<IncidentTransitionResult> {
    const result = await this.dependencies.transactionRunner.run(
      async (transaction) => {
        const record = await transaction.incidents.findById(command.incidentId);

        if (record === null) {
          throw new Error('Incident not found.');
        }

        const eventId = this.dependencies.idGenerator.generate();
        const outboxId = this.dependencies.idGenerator.generate();
        const assignedAt = this.dependencies.clock.now();
        const incident = rehydrateIncident(record);

        incident.assign({
          flowId: eventId,
          actorId: command.actorId,
          assignedAt,
        });

        const updatedRecord = {
          ...record,
          currentProjectionState: {
            ...record.currentProjectionState,
            status: incident.currentStatus,
            assignedAt: assignedAt.toISOString(),
            assignedActorId: command.actorId,
          },
        };

        await persistIncidentTransition(
          transaction,
          incident,
          updatedRecord,
          eventId,
          outboxId,
          assignedAt,
        );

        return {
          incidentId: command.incidentId,
          eventId,
          outboxId,
        };
      },
    );

    await this.dependencies.createNotificationUseCase.execute({
      recipientId: command.actorId,
      type: INCIDENT_ASSIGNED_NOTIFICATION_TYPE,
      channel: INCIDENT_ASSIGNED_NOTIFICATION_CHANNEL,
      message: INCIDENT_ASSIGNED_NOTIFICATION_MESSAGE,
    });

    return result;
  }
}
