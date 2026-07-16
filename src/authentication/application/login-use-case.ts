import { UnauthorizedException } from '@nestjs/common';

import { JwtTokenIssuer } from './jwt-token-issuer';
import { UserQueryRepository } from './user-query-persistence';

export type LoginCommand = {
  email: string;
};

export type LoginResult = {
  accessToken: string;
  expiresIn: number;
};

export type LoginUseCaseDependencies = {
  userQueryRepository: UserQueryRepository;
  jwtTokenIssuer: JwtTokenIssuer;
};

export class LoginUseCase {
  constructor(private readonly dependencies: LoginUseCaseDependencies) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const user = await this.dependencies.userQueryRepository.findByEmail(
      command.email,
    );

    if (user === null) {
      throw new UnauthorizedException();
    }

    return this.dependencies.jwtTokenIssuer.issueAccessToken(user.id);
  }
}
