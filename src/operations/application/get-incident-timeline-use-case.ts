import {
  IncidentTimelineRepository,
  IncidentTimelineView,
} from './incident-timeline';

export type GetIncidentTimelineCommand = {
  incidentId: string;
};

export type GetIncidentTimelineUseCaseDependencies = {
  incidentTimelineRepository: IncidentTimelineRepository;
};

export class GetIncidentTimelineUseCase {
  constructor(
    private readonly dependencies: GetIncidentTimelineUseCaseDependencies,
  ) {}

  async execute(
    command: GetIncidentTimelineCommand,
  ): Promise<IncidentTimelineView> {
    return this.dependencies.incidentTimelineRepository.findTimelineByIncidentId(
      command.incidentId,
    );
  }
}
