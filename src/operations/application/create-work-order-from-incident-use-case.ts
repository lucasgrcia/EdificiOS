import { IncidentNotFoundError } from '../domain/incident/incident-not-found';
import { CreateWorkOrderUseCase } from './create-work-order-use-case';
import { IncidentQueryRepository } from './incident-query-persistence';
import { WorkOrderResult } from './work-order-result';

export type CreateWorkOrderFromIncidentCommand = {
  incidentId: string;
  description: string;
};

export type CreateWorkOrderFromIncidentUseCaseDependencies = {
  incidentQueryRepository: IncidentQueryRepository;
  createWorkOrderUseCase: CreateWorkOrderUseCase;
};

export class CreateWorkOrderFromIncidentUseCase {
  constructor(
    private readonly dependencies: CreateWorkOrderFromIncidentUseCaseDependencies,
  ) {}

  async execute(
    command: CreateWorkOrderFromIncidentCommand,
  ): Promise<WorkOrderResult> {
    const incident = await this.dependencies.incidentQueryRepository.findById(
      command.incidentId,
    );

    if (incident === null) {
      throw new IncidentNotFoundError(command.incidentId);
    }

    const actorId = incident.assignedActorId ?? incident.actorId;

    return this.dependencies.createWorkOrderUseCase.execute({
      incidentId: command.incidentId,
      actorId,
      description: command.description,
    });
  }
}
