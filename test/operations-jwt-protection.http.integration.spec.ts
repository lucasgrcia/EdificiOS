import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import multipart from '@fastify/multipart';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { createFastifyTestApp } from './support/create-fastify-test-app';
import { OpenAPIObject } from '@nestjs/swagger/dist/interfaces';

import { Pool } from 'pg';

import { AppModule } from '../src/app.module';
import {
  AUTHENTICATION_CONTEXT,
  AuthenticationContext,
} from '../src/authentication/application/authentication-context';
import { AuthenticatedUserView } from '../src/authentication/application/authenticated-user-view';
import { CreateUserUseCase } from '../src/authentication/application/create-user-use-case';
import { GetAuthenticatedUserUseCase } from '../src/authentication/application/get-authenticated-user-use-case';
import { GetCurrentUserUseCase } from '../src/authentication/application/get-current-user-use-case';
import { LoginUseCase } from '../src/authentication/application/login-use-case';
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
import { UserQueryRepository } from '../src/authentication/application/user-query-persistence';
import { DashboardView } from '../src/operations/application/dashboard-view';
import { GetOperationsDashboardUseCase } from '../src/operations/application/get-operations-dashboard-use-case';
import { DashboardController } from '../src/operations/infrastructure/http/dashboard.controller';
import { ApplicationConfig } from '../src/config/application-config';
import { ApplicationConfigModule } from '../src/config/application-config.module';
import { GetHealthUseCase } from '../src/health/application/get-health-use-case';
import { HealthController } from '../src/health/infrastructure/http/health.controller';
import { InfoModule } from '../src/info/info.module';
import { setupSwagger } from '../src/shared/http/swagger/setup-swagger';

describe('Operations JWT protection HTTP integration', () => {
  const userId = '11111111-1111-1111-1111-111111111111';
  const email = 'demo@edificios.local';
  const authenticatedUser: AuthenticatedUserView = {
    id: userId,
    email,
    displayName: 'Demo User',
    status: 'ACTIVE',
    createdAt: '2026-07-10T08:00:00.000Z',
  };
  const dashboard: DashboardView = {
    generatedAt: '2026-07-10T12:00:00.000Z',
    summary: {
      totalSites: 0,
      totalAssets: 0,
      activeShifts: 0,
      openIncidents: 0,
      inProgressIncidents: 0,
      resolvedToday: 0,
      openWorkOrders: 0,
      completedToday: 0,
      pendingNotifications: 0,
    },
    totals: {
      sites: 0,
      incidents: {
        detected: 0,
        assigned: 0,
        inProgress: 0,
        resolved: 0,
      },
    },
    sites: [],
    openIncidents: [],
    recentEvents: [],
    recentIncidents: [],
    recentWorkOrders: [],
    recentNotifications: [],
    notifications: [],
    activityFeed: [],
  };

  let app: NestFastifyApplication;
  let applicationConfig: ApplicationConfig;
  let jwtService: JwtService;

  beforeEach(async () => {
    const userQueryRepository: UserQueryRepository = {
      findById: jest.fn(async (id: string) =>
        id === userId ? authenticatedUser : null,
      ),
      findByEmail: jest.fn(async (lookupEmail: string) =>
        lookupEmail === email ? authenticatedUser : null,
      ),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [ApplicationConfigModule, AuthenticationJwtModule],
      controllers: [DashboardController],
      providers: [
        AuthenticationHttpContext,
        JWTAuthenticationContext,
        JwtAuthenticationGuard,
        NestJwtTokenIssuer,
        {
          provide: AUTHENTICATION_CONTEXT,
          useExisting: JWTAuthenticationContext,
        },
        {
          provide: GetOperationsDashboardUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue(dashboard),
          },
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

  describe('GET /api/v1/operations/dashboard', () => {
    it('returns 200 OK with a valid JWT', async () => {
      const token = signToken({ userId });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/operations/dashboard',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
    });

    it('returns 401 without JWT', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/operations/dashboard',
      });

      expect(response.statusCode).toBe(401);
    });

    it('returns 401 with an invalid JWT', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/operations/dashboard',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('returns 401 with an expired JWT', async () => {
      const token = signToken({ userId }, { expiresIn: '-1s' });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/operations/dashboard',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });
});

describe('Public endpoints remain accessible', () => {
  describe('POST /api/v1/authentication/login', () => {
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

    beforeEach(async () => {
      const userQueryRepository: UserQueryRepository = {
        findById: jest.fn(),
        findByEmail: jest.fn(async (lookupEmail: string) =>
          lookupEmail === email ? authenticatedUser : null,
        ),
      };

      const moduleRef = await Test.createTestingModule({
        imports: [ApplicationConfigModule, AuthenticationJwtModule],
        controllers: [LoginController],
        providers: [
          LoginRequestPipe,
          NestJwtTokenIssuer,
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

      app = await createFastifyTestApp(moduleRef);
    });

    afterEach(async () => {
      await app.close();
    });

    it('allows login without JWT', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/authentication/login',
        payload: { email },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(
        expect.objectContaining({
          accessToken: expect.any(String),
          expiresIn: 3600,
        }),
      );
    });
  });

  describe('Authentication users', () => {
    const userId = '00000000-0000-0000-0000-000000000010';
    const authenticatedUser: AuthenticatedUserView = {
      id: userId,
      email: 'porter@torre-norte.edificios',
      displayName: 'Carlos Porter',
      status: 'ACTIVE',
      createdAt: '2026-07-10T08:00:00.000Z',
    };

    let app: NestFastifyApplication;

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        controllers: [AuthenticatedUserController],
        providers: [
          CreateUserRequestPipe,
          GetAuthenticatedUserParamsPipe,
          JwtAuthenticationGuard,
          {
            provide: AUTHENTICATION_CONTEXT,
            useValue: {
              getCurrentUserId: () => null,
            } satisfies AuthenticationContext,
          },
          {
            provide: CreateUserUseCase,
            useValue: {
              execute: jest.fn().mockResolvedValue({ userId }),
            },
          },
          {
            provide: GetAuthenticatedUserUseCase,
            useValue: {
              execute: jest.fn().mockResolvedValue(authenticatedUser),
            },
          },
          {
            provide: GetCurrentUserUseCase,
            useValue: { execute: jest.fn() },
          },
        ],
      }).compile();

      app = await createFastifyTestApp(moduleRef);
    });

    afterEach(async () => {
      await app.close();
    });

    it('allows POST /api/v1/authentication/users without JWT', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/authentication/users',
        payload: {
          email: 'porter@torre-norte.edificios',
          displayName: 'Carlos Porter',
        },
      });

      expect(response.statusCode).toBe(201);
    });

    it('allows GET /api/v1/authentication/users/:id without JWT', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/authentication/users/${userId}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(authenticatedUser);
    });
  });

  describe('System endpoints', () => {
    let swaggerApp: NestFastifyApplication;
    let applicationConfig: ApplicationConfig;

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      swaggerApp = moduleRef.createNestApplication(new FastifyAdapter());
      applicationConfig = swaggerApp.get(ApplicationConfig);
      await swaggerApp.register(multipart);
      setupSwagger(swaggerApp);
      await swaggerApp.init();
      await swaggerApp.getHttpAdapter().getInstance().ready();
    });

    afterEach(async () => {
      await swaggerApp.close();
    });

    it('allows GET /api/docs without JWT', async () => {
      const response = await swaggerApp.inject({
        method: 'GET',
        url: applicationConfig.swaggerPath,
      });

      expect(response.statusCode).toBe(200);
    });

    it('allows GET /api/docs-json without JWT', async () => {
      const response = await swaggerApp.inject({
        method: 'GET',
        url: `${applicationConfig.swaggerPath}-json`,
      });

      expect(response.statusCode).toBe(200);
      expect((response.json() as OpenAPIObject).openapi).toMatch(/^3\./);
    });
  });

  describe('GET /api/v1/health', () => {
    let app: NestFastifyApplication;

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [ApplicationConfigModule],
        controllers: [HealthController],
        providers: [
          {
            provide: GetHealthUseCase,
            useFactory: (config: ApplicationConfig) =>
              new GetHealthUseCase({
                pool: {
                  query: jest
                    .fn()
                    .mockResolvedValue({ rowCount: 1, rows: [{ '?column?': 1 }] }),
                } as unknown as Pool,
                clock: {
                  now: () => new Date('2026-07-11T13:00:00.000Z'),
                },
                applicationConfig: config,
              }),
            inject: [ApplicationConfig],
          },
        ],
      }).compile();

      app = await createFastifyTestApp(moduleRef);
    });

    afterEach(async () => {
      await app.close();
    });

    it('allows health check without JWT', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('GET /api/v1/info', () => {
    let app: NestFastifyApplication;

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [ApplicationConfigModule, InfoModule],
      }).compile();

      app = await createFastifyTestApp(moduleRef);
    });

    afterEach(async () => {
      await app.close();
    });

    it('allows info without JWT', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/info',
      });

      expect(response.statusCode).toBe(200);
    });
  });
});
