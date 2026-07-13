import { UserQueryRepository } from './user-query-persistence';
import { AuthenticatedUserView } from './authenticated-user-view';

export type GetAuthenticatedUserCommand = {
  userId: string;
};

export type GetAuthenticatedUserUseCaseDependencies = {
  userQueryRepository: UserQueryRepository;
};

export class GetAuthenticatedUserUseCase {
  constructor(
    private readonly dependencies: GetAuthenticatedUserUseCaseDependencies,
  ) {}

  async execute(
    command: GetAuthenticatedUserCommand,
  ): Promise<AuthenticatedUserView | null> {
    return this.dependencies.userQueryRepository.findById(command.userId);
  }
}
