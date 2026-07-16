import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';

import {
  AUTHENTICATION_CONTEXT,
  AuthenticationContext,
} from '../src/authentication/application/authentication-context';
import { AuthenticatedUserView } from '../src/authentication/application/authenticated-user-view';
import { GetAuthenticatedUserUseCase } from '../src/authentication/application/get-authenticated-user-use-case';
import { GetCurrentUserUseCase } from '../src/authentication/application/get-current-user-use-case';
import { LoginUseCase } from '../src/authentication/application/login-use-case';
import { UserQueryRepository } from '../src/authentication/application/user-query-persistence';
import { AuthenticatedUserController } from '../src/authentication/infrastructure/http/authenticated-user.controller';
import { CreateUserRequestPipe } from '../src/authentication/infrastructure/http/create-user-request.pipe';
import { GetAuthenticatedUserParamsPipe } from '../src/authentication/infrastructure/http/get-authenticated-user-params.pipe';
import { LoginController } from '../src/authentication/infrastructure/http/login.controller';
import { LoginRequestPipe } from '../src/authentication/infrastructure/http/login-request.pipe';
import { AuthenticationHttpContext } from '../src/authentication/infrastructure/http/authentication-http-context';
import { JWTAuthenticationContext } from '../src/authentication/infrastructure/http/jwt-authentication-context';
import { JwtAuthenticationGuard } from '../src/authentication/infrastructure/http/jwt-authentication.guard';
import { AuthenticationJwtModule } from '../src/authentication/infrastructure/jwt/authentication-jwt.module';
import { NestJwtTokenIssuer } from '../src/authentication/infrastructure/jwt/nest-jwt-token-issuer';
import { CreateUserUseCase } from '../src/authentication/application/create-user-use-case';
import { ApplicationConfigModule } from '../src/config/application-config.module';

describe('Login HTTP integration', () => {
  const userId = '00000000-0000-0000-0000-000000000010';
  const email = 'demo@edificios.local';
  const authenticatedUser: AuthenticatedUserView = {
    id: userId,
    email,
    displayName: 'Demo User',
    status: 'ACTIVE',
    createdAt: '2026-07-10T08:00:00.000Z',
  };

  let app: NestFastifyApplication;
  let userQueryRepository: UserQueryRepository;
  let getAuthenticatedUserUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    userQueryRepository = {
      findById: jest.fn(async (id: string) =>
        id === userId ? authenticatedUser : null,
      ),
      findByEmail: jest.fn(async (lookupEmail: string) =>
        lookupEmail === email ? authenticatedUser : null,
      ),
    };

    getAuthenticatedUserUseCase = {
      execute: jest.fn(async ({ userId: lookupUserId }: { userId: string }) =>
        lookupUserId === userId ? authenticatedUser : null,
      ),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [ApplicationConfigModule, AuthenticationJwtModule],
      controllers: [LoginController, AuthenticatedUserController],
      providers: [
        LoginRequestPipe,
        CreateUserRequestPipe,
        GetAuthenticatedUserParamsPipe,
        AuthenticationHttpContext,
        JWTAuthenticationContext,
        JwtAuthenticationGuard,
        NestJwtTokenIssuer,
        {
          provide: AUTHENTICATION_CONTEXT,
          useExisting: JWTAuthenticationContext,
        },
        {
          provide: CreateUserUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetAuthenticatedUserUseCase,
          useValue: getAuthenticatedUserUseCase,
        },
        {
          provide: GetCurrentUserUseCase,
          inject: [AUTHENTICATION_CONTEXT, GetAuthenticatedUserUseCase],
          useFactory: (
            authContext: AuthenticationContext,
            queryUseCase: GetAuthenticatedUserUseCase,
          ) =>
            new GetCurrentUserUseCase({
              authenticationContext: authContext,
              getAuthenticatedUserUseCase: queryUseCase,
            }),
        },
        {
          provide: LoginUseCase,
          inject: [NestJwtTokenIssuer],
          useFactory: (jwtTokenIssuer: NestJwtTokenIssuer) =>
            new LoginUseCase({
              userQueryRepository,
              jwtTokenIssuer,
            }),
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication(new FastifyAdapter());

    const authenticationHttpContext = moduleRef.get(AuthenticationHttpContext);
    const fastify = app.getHttpAdapter().getInstance();
    fastify.addHook('onRequest', (request, _reply, done) => {
      authenticationHttpContext.runWithAuthorization(
        request.headers.authorization,
        () => {
          done();
        },
      );
    });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/v1/authentication/login', () => {
    it('returns 200 OK with an access token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/authentication/login',
        payload: { email },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().accessToken).toEqual(expect.any(String));
    });

    it('returns 401 when the email does not exist', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/authentication/login',
        payload: { email: 'missing@edificios.local' },
      });

      expect(response.statusCode).toBe(401);
    });

    it('returns 400 when email is empty', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/authentication/login',
        payload: { email: '   ' },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toBe('Email is required.');
    });

    it('returns accessToken and expiresIn without user data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/authentication/login',
        payload: { email },
      });

      expect(response.json()).toEqual({
        accessToken: expect.any(String),
        expiresIn: 3600,
      });
    });

    it('issues a JWT that works immediately against GET /api/v1/authentication/me', async () => {
      const loginResponse = await app.inject({
        method: 'POST',
        url: '/api/v1/authentication/login',
        payload: { email },
      });

      const { accessToken } = loginResponse.json() as { accessToken: string };

      const meResponse = await app.inject({
        method: 'GET',
        url: '/api/v1/authentication/me',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      });

      expect(meResponse.statusCode).toBe(200);
      expect(meResponse.json()).toEqual(authenticatedUser);
      expect(getAuthenticatedUserUseCase.execute).toHaveBeenCalledWith({
        userId,
      });
    });
  });
});
