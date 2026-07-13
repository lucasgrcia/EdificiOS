import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

import {
  AUTHENTICATION_CONTEXT,
  AuthenticationContext,
} from '../src/authentication/application/authentication-context';
import { AuthenticatedUserView } from '../src/authentication/application/authenticated-user-view';
import { CreateUserUseCase } from '../src/authentication/application/create-user-use-case';
import { GetAuthenticatedUserUseCase } from '../src/authentication/application/get-authenticated-user-use-case';
import { GetCurrentUserUseCase } from '../src/authentication/application/get-current-user-use-case';
import { AuthenticationHttpContext } from '../src/authentication/infrastructure/http/authentication-http-context';
import { AuthenticatedUserController } from '../src/authentication/infrastructure/http/authenticated-user.controller';
import { CreateUserRequestPipe } from '../src/authentication/infrastructure/http/create-user-request.pipe';
import { GetAuthenticatedUserParamsPipe } from '../src/authentication/infrastructure/http/get-authenticated-user-params.pipe';
import { JWTAuthenticationContext } from '../src/authentication/infrastructure/http/jwt-authentication-context';
import { JwtAuthenticationGuard } from '../src/authentication/infrastructure/http/jwt-authentication.guard';
import { AuthenticationJwtModule } from '../src/authentication/infrastructure/jwt/authentication-jwt.module';
import { ApplicationConfig } from '../src/config/application-config';
import { ApplicationConfigModule } from '../src/config/application-config.module';

describe('JwtAuthenticationGuard integration', () => {
  const userId = '11111111-1111-1111-1111-111111111111';
  const authenticatedUser: AuthenticatedUserView = {
    id: userId,
    email: 'porter@torre-norte.edificios',
    displayName: 'Carlos Porter',
    status: 'ACTIVE',
    createdAt: '2026-07-10T08:00:00.000Z',
  };

  let app: NestFastifyApplication;
  let applicationConfig: ApplicationConfig;
  let jwtService: JwtService;
  let getAuthenticatedUserUseCase: { execute: jest.Mock };
  let createUserUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    getAuthenticatedUserUseCase = {
      execute: jest.fn().mockResolvedValue(authenticatedUser),
    };
    createUserUseCase = {
      execute: jest.fn().mockResolvedValue({ userId }),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [ApplicationConfigModule, AuthenticationJwtModule],
      controllers: [AuthenticatedUserController],
      providers: [
        CreateUserRequestPipe,
        GetAuthenticatedUserParamsPipe,
        AuthenticationHttpContext,
        JWTAuthenticationContext,
        JwtAuthenticationGuard,
        {
          provide: AUTHENTICATION_CONTEXT,
          useExisting: JWTAuthenticationContext,
        },
        {
          provide: CreateUserUseCase,
          useValue: createUserUseCase,
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
      ],
    }).compile();

    app = moduleRef.createNestApplication(new FastifyAdapter());
    applicationConfig = moduleRef.get(ApplicationConfig);
    jwtService = moduleRef.get(JwtService);

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

  function signToken(
    payload: { userId: string },
    options?: { secret?: string; expiresIn?: JwtSignOptions['expiresIn'] },
  ): string {
    return jwtService.sign(payload, {
      secret: options?.secret ?? applicationConfig.jwtSecret,
      expiresIn:
        options?.expiresIn ??
        (applicationConfig.jwtExpiration as JwtSignOptions['expiresIn']),
      issuer: applicationConfig.jwtIssuer,
      audience: applicationConfig.jwtAudience,
    });
  }

  describe('GET /api/v1/authentication/me', () => {
    it('allows access with a valid JWT', async () => {
      const token = signToken({ userId });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/authentication/me',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(authenticatedUser);
      expect(getAuthenticatedUserUseCase.execute).toHaveBeenCalledWith({
        userId,
      });
    });

    it('returns 401 without Authorization header', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/authentication/me',
      });

      expect(response.statusCode).toBe(401);
      expect(getAuthenticatedUserUseCase.execute).not.toHaveBeenCalled();
    });

    it('returns 401 with an invalid JWT signature', async () => {
      const token = signToken(
        { userId },
        { secret: 'another-secret-not-used-by-the-app' },
      );

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/authentication/me',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(401);
      expect(getAuthenticatedUserUseCase.execute).not.toHaveBeenCalled();
    });

    it('returns 401 with an expired JWT', async () => {
      const token = signToken({ userId }, { expiresIn: '-1s' });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/authentication/me',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(401);
      expect(getAuthenticatedUserUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('public authentication endpoints', () => {
    it('allows POST /api/v1/authentication/users without Authorization', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/authentication/users',
        headers: {
          'content-type': 'application/json',
        },
        payload: {
          email: 'porter@torre-norte.edificios',
          displayName: 'Carlos Porter',
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual({ userId });
      expect(createUserUseCase.execute).toHaveBeenCalledWith({
        email: 'porter@torre-norte.edificios',
        displayName: 'Carlos Porter',
      });
    });

    it('allows GET /api/v1/authentication/users/:id without Authorization', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/authentication/users/${userId}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(authenticatedUser);
      expect(getAuthenticatedUserUseCase.execute).toHaveBeenCalledWith({
        userId,
      });
    });
  });
});
