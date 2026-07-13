import { UnauthorizedException } from '@nestjs/common';

import { AuthenticationContext } from './authentication-context';
import { AuthenticatedUserView } from './authenticated-user-view';
import { GetAuthenticatedUserUseCase } from './get-authenticated-user-use-case';

export type GetCurrentUserUseCaseDependencies = {
  authenticationContext: AuthenticationContext;
  getAuthenticatedUserUseCase: GetAuthenticatedUserUseCase;
};

export class GetCurrentUserUseCase {
  constructor(
    private readonly dependencies: GetCurrentUserUseCaseDependencies,
  ) {}

  async execute(): Promise<AuthenticatedUserView> {
    const userId = this.dependencies.authenticationContext.getCurrentUserId();

    if (userId === null) {
      throw new UnauthorizedException();
    }

    const user = await this.dependencies.getAuthenticatedUserUseCase.execute({
      userId,
    });

    if (user === null) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
