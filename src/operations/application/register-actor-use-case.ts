import { ActorAggregate } from '../domain/actor/actor';
import { ActorRepository } from './actor-persistence';
import { ActorResult } from './actor-result';
import { IdGenerator } from './incident-persistence';
import { toActorRecord, toActorResult } from './map-actor';

export type RegisterActorCommand = {
  siteId: string;
  name: string;
  role: string;
  status: string;
};

export type RegisterActorUseCaseDependencies = {
  actorRepository: ActorRepository;
  idGenerator: IdGenerator;
};

export class RegisterActorUseCase {
  constructor(
    private readonly dependencies: RegisterActorUseCaseDependencies,
  ) {}

  async execute(command: RegisterActorCommand): Promise<ActorResult> {
    const actorId = this.dependencies.idGenerator.generate();
    const actor = ActorAggregate.register({
      actorId,
      name: command.name,
      role: command.role,
      status: command.status,
    });

    const record = toActorRecord(actor, command.siteId);
    await this.dependencies.actorRepository.save(record);

    return toActorResult(record);
  }
}
