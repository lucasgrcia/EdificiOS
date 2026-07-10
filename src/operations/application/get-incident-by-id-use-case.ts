import { IncidentQueryRepository } from './incident-query-persistence';
import { IncidentView } from './incident-view';

export type GetIncidentByIdCommand = {
  incidentId: string;
};

export type GetIncidentByIdUseCaseDependencies = {
  incidentQueryRepository: IncidentQueryRepository;
};

export class GetIncidentByIdUseCase {
  constructor(
    private readonly dependencies: GetIncidentByIdUseCaseDependencies,
  ) {}

  async execute(
    command: GetIncidentByIdCommand,
  ): Promise<IncidentView | null> {
    return this.dependencies.incidentQueryRepository.findById(
      command.incidentId,
    );
  }
}
