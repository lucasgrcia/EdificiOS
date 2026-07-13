import { randomUUID } from 'node:crypto';

import { Module } from '@nestjs/common';

import { AUTHENTICATION_CONTEXT } from './application/authentication-context';
import { CreateUserUseCase } from './application/create-user-use-case';
import { GetAuthenticatedUserUseCase } from './application/get-authenticated-user-use-case';
import { GetCurrentUserUseCase } from './application/get-current-user-use-case';
import { AuthenticatedUserController } from './infrastructure/http/authenticated-user.controller';
import { CreateUserRequestPipe } from './infrastructure/http/create-user-request.pipe';
import { GetAuthenticatedUserParamsPipe } from './infrastructure/http/get-authenticated-user-params.pipe';
import { StubAuthenticationContext } from './infrastructure/http/stub-authentication-context';
import { PostgresAuthenticationPool } from './infrastructure/persistence/postgres-authentication-pool';
import { PostgresUserQueryRepository } from './infrastructure/persistence/postgres-user-query-repository';
import { PostgresUserRepository } from './infrastructure/persistence/postgres-user-repository';

@Module({
  controllers: [AuthenticatedUserController],
  providers: [
    CreateUserRequestPipe,
    GetAuthenticatedUserParamsPipe,
    StubAuthenticationContext,
    PostgresAuthenticationPool,
    {
      provide: AUTHENTICATION_CONTEXT,
      useExisting: StubAuthenticationContext,
    },
    {
      provide: PostgresUserRepository,
      inject: [PostgresAuthenticationPool],
      useFactory: (authenticationPool: PostgresAuthenticationPool) =>
        new PostgresUserRepository(authenticationPool.pool),
    },
    {
      provide: PostgresUserQueryRepository,
      inject: [PostgresAuthenticationPool],
      useFactory: (authenticationPool: PostgresAuthenticationPool) =>
        new PostgresUserQueryRepository(authenticationPool.pool),
    },
    {
      provide: CreateUserUseCase,
      inject: [PostgresUserRepository],
      useFactory: (userRepository: PostgresUserRepository) =>
        new CreateUserUseCase({
          userRepository,
          idGenerator: {
            generate: () => randomUUID(),
          },
          clock: {
            now: () => new Date(),
          },
        }),
    },
    {
      provide: GetAuthenticatedUserUseCase,
      inject: [PostgresUserQueryRepository],
      useFactory: (userQueryRepository: PostgresUserQueryRepository) =>
        new GetAuthenticatedUserUseCase({
          userQueryRepository,
        }),
    },
    {
      provide: GetCurrentUserUseCase,
      inject: [AUTHENTICATION_CONTEXT, GetAuthenticatedUserUseCase],
      useFactory: (
        authenticationContext: StubAuthenticationContext,
        getAuthenticatedUserUseCase: GetAuthenticatedUserUseCase,
      ) =>
        new GetCurrentUserUseCase({
          authenticationContext,
          getAuthenticatedUserUseCase,
        }),
    },
  ],
  exports: [GetAuthenticatedUserUseCase, CreateUserUseCase, GetCurrentUserUseCase],
})
export class AuthenticationModule {}
