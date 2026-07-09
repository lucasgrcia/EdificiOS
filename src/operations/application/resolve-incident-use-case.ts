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

export type ResolveIncidentUseCaseDependencies = UseCaseDependencies;

export class ResolveIncidentUseCase {
  constructor(
    private readonly dependencies: ResolveIncidentUseCaseDependencies,
  ) {}

  async execute(
    command: ResolveIncidentCommand,
  ): Promise<IncidentTransitionResult> {
    return this.dependencies.transactionRunner.run(async (transaction) => {
      const record = await transaction.incidents.findById(command.incidentId);

      if (record === null) {
        throw new Error('Incident not found.');
      }

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
    });
  }
}
