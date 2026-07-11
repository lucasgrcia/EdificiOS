import {
  IncidentTransitionResult,
  UseCaseDependencies,
} from './incident-persistence';
import {
  persistIncidentTransition,
  rehydrateIncident,
} from './incident-transition';
import {
  INCIDENT_START_FAILURE_METRIC,
  INCIDENT_START_SUCCESS_METRIC,
} from '../../shared/metrics/metrics-view';

export type StartIncidentCommand = {
  incidentId: string;
};

const STARTED_MESSAGE = 'StartIncidentUseCase started';
const COMPLETED_MESSAGE = 'StartIncidentUseCase completed';
const FAILED_MESSAGE = 'StartIncidentUseCase failed';

export type StartIncidentUseCaseDependencies = UseCaseDependencies;

export class StartIncidentUseCase {
  constructor(
    private readonly dependencies: StartIncidentUseCaseDependencies,
  ) {}

  async execute(
    command: StartIncidentCommand,
  ): Promise<IncidentTransitionResult> {
    this.dependencies.logger.info(STARTED_MESSAGE);

    try {
      const result = await this.dependencies.transactionRunner.run(
        async (transaction) => {
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

          const correlationId = this.dependencies.correlationIdProvider.get();

          await persistIncidentTransition(
            transaction,
            incident,
            updatedRecord,
            eventId,
            outboxId,
            startedAt,
            correlationId,
          );

          return {
            incidentId: command.incidentId,
            eventId,
            outboxId,
          };
        },
      );

      this.dependencies.logger.info(COMPLETED_MESSAGE);
      this.dependencies.metrics.increment(INCIDENT_START_SUCCESS_METRIC);

      return result;
    } catch (error) {
      this.dependencies.logger.error(FAILED_MESSAGE);
      this.dependencies.metrics.increment(INCIDENT_START_FAILURE_METRIC);
      throw error;
    }
  }
}
