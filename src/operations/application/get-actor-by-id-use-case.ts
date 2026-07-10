import { ActorRepository } from './actor-persistence';
import { ActorResult } from './actor-result';
import { toActorResult } from './map-actor';

export type GetActorByIdCommand = {
  actorId: string;
};

export type GetActorByIdUseCaseDependencies = {
  actorRepository: ActorRepository;
};

export class GetActorByIdUseCase {
  constructor(
    private readonly dependencies: GetActorByIdUseCaseDependencies,
  ) {}

  async execute(command: GetActorByIdCommand): Promise<ActorResult | null> {
    const record = await this.dependencies.actorRepository.findById(
      command.actorId,
    );

    if (record === null) {
      return null;
    }

    return toActorResult(record);
  }
}
