import { EvidenceQueryRepository } from './evidence-query-persistence';
import { EvidenceView } from './evidence-view';

export type ListEvidenceByEventCommand = {
  eventId: string;
};

export type ListEvidenceByEventUseCaseDependencies = {
  evidenceQueryRepository: EvidenceQueryRepository;
};

export class ListEvidenceByEventUseCase {
  constructor(
    private readonly dependencies: ListEvidenceByEventUseCaseDependencies,
  ) {}

  async execute(command: ListEvidenceByEventCommand): Promise<EvidenceView[]> {
    return this.dependencies.evidenceQueryRepository.findByEventId(
      command.eventId,
    );
  }
}
