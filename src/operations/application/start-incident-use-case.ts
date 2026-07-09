import {
  IncidentTransitionResult,
  UseCaseDependencies,
} from './incident-persistence';
import {
  persistIncidentTransition,
  rehydrateIncident,
} from './incident-transition';

export type StartIncidentCommand = {
  incidentId: string;
};

export type StartIncidentUseCaseDependencies = UseCaseDependencies;

export class StartIncidentUseCase {
  constructor(
    private readonly dependencies: StartIncidentUseCaseDependencies,
  ) {}

  async execute(
    command: StartIncidentCommand,
  ): Promise<IncidentTransitionResult> {
    return this.dependencies.transactionRunner.run(async (transaction) => {
      const record = await transaction.incidents.findById(command.incidentId);

      if (record === null) {
        throw new Error('Incident not found.');
      }

      const eventId = this.dependencies.idGenerator.generate();
      const outboxId = this.dependencies.idGenerator.generate();
      const startedAt = this.dependencies.clock.now();
      const incident = rehydrateIncident(record);

      incident.start({
        flowId: eventId,
        startedAt,
      });

      const updatedRecord = {
        ...record,
        currentProjectionState: {
          ...record.currentProjectionState,
          status: incident.currentStatus,
          startedAt: startedAt.toISOString(),
        },
      };

      await persistIncidentTransition(
        transaction,
        incident,
        updatedRecord,
        eventId,
        outboxId,
        startedAt,
      );

      return {
        incidentId: command.incidentId,
        eventId,
        outboxId,
      };
    });
  }
}
