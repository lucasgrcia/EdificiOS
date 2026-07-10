import { ActorId } from './value-objects/actor-id';
import { ActorName } from './value-objects/actor-name';
import { ActorRole } from './value-objects/actor-role';
import { ActorStatus } from './value-objects/actor-status';

export type RegisterActorInput = {
  actorId: string;
  name: string;
  role: string;
  status: string;
};

export type RehydrateActorInput = {
  actorId: string;
  name: string;
  role: string;
  status: string;
};

export class ActorAggregate {
  private constructor(
    private readonly actorIdentifier: ActorId,
    private readonly actorName: ActorName,
    private readonly actorRole: ActorRole,
    private readonly actorStatus: ActorStatus,
  ) {}

  static register(input: RegisterActorInput): ActorAggregate {
    if (input.actorId.trim().length === 0) {
      throw new Error('Actor id is required.');
    }

    return new ActorAggregate(
      ActorId.create(input.actorId),
      ActorName.create(input.name),
      ActorRole.create(input.role),
      ActorStatus.create(input.status),
    );
  }

  static rehydrate(input: RehydrateActorInput): ActorAggregate {
    if (input.actorId.trim().length === 0) {
      throw new Error('Actor id is required.');
    }

    return new ActorAggregate(
      ActorId.create(input.actorId),
      ActorName.create(input.name),
      ActorRole.create(input.role),
      ActorStatus.create(input.status),
    );
  }

  get id(): string {
    return this.actorIdentifier.toString();
  }

  get name(): string {
    return this.actorName.toString();
  }

  get role(): string {
    return this.actorRole.toString();
  }

  get status(): string {
    return this.actorStatus.toString();
  }
}
