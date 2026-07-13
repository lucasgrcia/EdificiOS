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
import { GetAuthenticatedUserUseCase } from '../src/authentication/application/get-authenticated-user-use-case';
import { GetCurrentUserUseCase } from '../src/authentication/application/get-current-user-use-case';
import { AuthenticationHttpContext } from '../src/authentication/infrastructure/http/authentication-http-context';
import { AuthenticatedUserController } from '../src/authentication/infrastructure/http/authenticated-user.controller';
import { CreateUserRequestPipe } from '../src/authentication/infrastructure/http/create-user-request.pipe';
import { GetAuthenticatedUserParamsPipe } from '../src/authentication/infrastructure/http/get-authenticated-user-params.pipe';
import { JWTAuthenticationContext } from '../src/authentication/infrastructure/http/jwt-authentication-context';
import { JwtAuthenticationGuard } from '../src/authentication/infrastructure/http/jwt-authentication.guard';
import { AuthenticationJwtModule } from '../src/authentication/infrastructure/jwt/authentication-jwt.module';
import { CreateUserUseCase } from '../src/authentication/application/create-user-use-case';
import { ApplicationConfig } from '../src/config/application-config';
import { ApplicationConfigModule } from '../src/config/application-config.module';

describe('JWT authentication context integration', () => {
  const userId = '11111111-1111-1111-1111-111111111111';

  let applicationConfig: ApplicationConfig;
  let authenticationHttpContext: AuthenticationHttpContext;
  let jwtService: JwtService;
  let authenticationContext: JWTAuthenticationContext;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ApplicationConfigModule, AuthenticationJwtModule],
      providers: [
        AuthenticationHttpContext,
        JWTAuthenticationContext,
        {
          provide: AUTHENTICATION_CONTEXT,
          useExisting: JWTAuthenticationContext,
        },
      ],
    }).compile();

    applicationConfig = moduleRef.get(ApplicationConfig);
    authenticationHttpContext = moduleRef.get(AuthenticationHttpContext);
    jwtService = moduleRef.get(JwtService);
    authenticationContext = moduleRef.get(JWTAuthenticationContext);
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

  function resolveUserId(authorization: string | undefined): string | null {
    return authenticationHttpContext.runWithAuthorization(authorization, () =>
      authenticationContext.getCurrentUserId(),
    );
  }

  it('returns userId when JWT is valid', () => {
    const token = signToken({ userId });

    expect(resolveUserId(`Bearer ${token}`)).toBe(userId);
  });

  it('returns null when JWT is expired', () => {
    const token = signToken({ userId }, { expiresIn: '-1s' });

    expect(resolveUserId(`Bearer ${token}`)).toBeNull();
  });

  it('returns null when JWT signature is invalid', () => {
    const token = signToken(
      { userId },
      { secret: 'another-secret-not-used-by-the-app' },
    );

    expect(resolveUserId(`Bearer ${token}`)).toBeNull();
  });

  it('returns null when Authorization header is missing', () => {
    expect(resolveUserId(undefined)).toBeNull();
  });

  it('returns null when Authorization header is malformed', () => {
    const token = signToken({ userId });

    expect(resolveUserId('Basic credentials')).toBeNull();
    expect(resolveUserId('Bearer')).toBeNull();
    expect(resolveUserId(`Token ${token}`)).toBeNull();
    expect(resolveUserId(`Bearer ${token} extra`)).toBeNull();
  });
});

describe('GET /api/v1/authentication/me with JWT', () => {
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

  beforeEach(async () => {
    getAuthenticatedUserUseCase = {
      execute: jest.fn().mockResolvedValue(authenticatedUser),
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

  function signToken(payload: { userId: string }): string {
    return jwtService.sign(payload, {
      secret: applicationConfig.jwtSecret,
      expiresIn: applicationConfig.jwtExpiration as JwtSignOptions['expiresIn'],
      issuer: applicationConfig.jwtIssuer,
      audience: applicationConfig.jwtAudience,
    });
  }

  it('returns 200 OK with the current authenticated user when JWT is valid', async () => {
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

  it('returns 401 when authentication context resolves to null', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/authentication/me',
    });

    expect(response.statusCode).toBe(401);
    expect(getAuthenticatedUserUseCase.execute).not.toHaveBeenCalled();
  });
});
