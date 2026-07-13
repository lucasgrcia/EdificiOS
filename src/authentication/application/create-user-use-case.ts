import {
  Clock,
  IdGenerator,
  UserPersistence,
  UserRecord,
} from './user-persistence';

export type CreateUserCommand = {
  email: string;
  displayName: string;
};

export type CreateUserResult = {
  userId: string;
};

export type CreateUserUseCaseDependencies = {
  userRepository: UserPersistence;
  idGenerator: IdGenerator;
  clock: Clock;
};

const DEFAULT_USER_STATUS = 'ACTIVE';

export class CreateUserUseCase {
  constructor(private readonly dependencies: CreateUserUseCaseDependencies) {}

  async execute(command: CreateUserCommand): Promise<CreateUserResult> {
    const userId = this.dependencies.idGenerator.generate();
    const record: UserRecord = {
      id: userId,
      email: command.email.trim().toLowerCase(),
      displayName: command.displayName.trim(),
      status: DEFAULT_USER_STATUS,
      createdAt: this.dependencies.clock.now(),
    };

    await this.dependencies.userRepository.create(record);

    return { userId };
  }
}
