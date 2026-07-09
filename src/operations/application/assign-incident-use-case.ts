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

export type AssignIncidentUseCaseDependencies = UseCaseDependencies;

export class AssignIncidentUseCase {
  constructor(
    private readonly dependencies: AssignIncidentUseCaseDependencies,
  ) {}

  async execute(
    command: AssignIncidentCommand,
  ): Promise<IncidentTransitionResult> {
    return this.dependencies.transactionRunner.run(async (transaction) => {
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
    });
  }
}
