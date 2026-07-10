import { ActorRepository } from './actor-persistence';
import { ActorResult } from './actor-result';
import { toActorResult } from './map-actor';

export type ListActorsBySiteCommand = {
  siteId: string;
};

export type ListActorsBySiteUseCaseDependencies = {
  actorRepository: ActorRepository;
};

export class ListActorsBySiteUseCase {
  constructor(
    private readonly dependencies: ListActorsBySiteUseCaseDependencies,
  ) {}

  async execute(command: ListActorsBySiteCommand): Promise<ActorResult[]> {
    const records = await this.dependencies.actorRepository.findBySite(
      command.siteId,
    );

    return records.map((record) => toActorResult(record));
  }
}
