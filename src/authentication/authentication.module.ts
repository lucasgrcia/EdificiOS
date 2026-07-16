import { randomUUID } from 'node:crypto';

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { AUTHENTICATION_CONTEXT } from './application/authentication-context';
import { CreateUserUseCase } from './application/create-user-use-case';
import { GetAuthenticatedUserUseCase } from './application/get-authenticated-user-use-case';
import { GetCurrentUserUseCase } from './application/get-current-user-use-case';
import { LoginUseCase } from './application/login-use-case';
import { AuthenticationContextMiddleware } from './infrastructure/http/authentication-context.middleware';
import { AuthenticationHttpContext } from './infrastructure/http/authentication-http-context';
import { AuthenticatedUserController } from './infrastructure/http/authenticated-user.controller';
import { CreateUserRequestPipe } from './infrastructure/http/create-user-request.pipe';
import { GetAuthenticatedUserParamsPipe } from './infrastructure/http/get-authenticated-user-params.pipe';
import { LoginController } from './infrastructure/http/login.controller';
import { LoginRequestPipe } from './infrastructure/http/login-request.pipe';
import { JWTAuthenticationContext } from './infrastructure/http/jwt-authentication-context';
import { JwtAuthenticationGuard } from './infrastructure/http/jwt-authentication.guard';
import { AuthenticationJwtModule } from './infrastructure/jwt/authentication-jwt.module';
import { NestJwtTokenIssuer } from './infrastructure/jwt/nest-jwt-token-issuer';
import { PostgresAuthenticationPool } from './infrastructure/persistence/postgres-authentication-pool';
import { PostgresUserQueryRepository } from './infrastructure/persistence/postgres-user-query-repository';
import { PostgresUserRepository } from './infrastructure/persistence/postgres-user-repository';

@Module({
  imports: [AuthenticationJwtModule],
  controllers: [AuthenticatedUserController, LoginController],
  providers: [
    CreateUserRequestPipe,
    LoginRequestPipe,
    GetAuthenticatedUserParamsPipe,
    NestJwtTokenIssuer,
    AuthenticationHttpContext,
    AuthenticationContextMiddleware,
    JWTAuthenticationContext,
    JwtAuthenticationGuard,
    PostgresAuthenticationPool,
    {
      provide: AUTHENTICATION_CONTEXT,
      useExisting: JWTAuthenticationContext,
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
        authenticationContext: JWTAuthenticationContext,
        getAuthenticatedUserUseCase: GetAuthenticatedUserUseCase,
      ) =>
        new GetCurrentUserUseCase({
          authenticationContext,
          getAuthenticatedUserUseCase,
        }),
    },
    {
      provide: LoginUseCase,
      inject: [PostgresUserQueryRepository, NestJwtTokenIssuer],
      useFactory: (
        userQueryRepository: PostgresUserQueryRepository,
        jwtTokenIssuer: NestJwtTokenIssuer,
      ) =>
        new LoginUseCase({
          userQueryRepository,
          jwtTokenIssuer,
        }),
    },
  ],
  exports: [JwtAuthenticationGuard, AUTHENTICATION_CONTEXT],
})
export class AuthenticationModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AuthenticationContextMiddleware).forRoutes('*');
  }
}
