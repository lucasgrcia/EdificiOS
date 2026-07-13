import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';

import { AuthenticatedUserView } from '../src/authentication/application/authenticated-user-view';
import { CreateUserUseCase } from '../src/authentication/application/create-user-use-case';
import { GetAuthenticatedUserUseCase } from '../src/authentication/application/get-authenticated-user-use-case';
import { GetCurrentUserUseCase } from '../src/authentication/application/get-current-user-use-case';
import {
  AUTHENTICATION_CONTEXT,
  AuthenticationContext,
} from '../src/authentication/application/authentication-context';
import { JwtAuthenticationGuard } from '../src/authentication/infrastructure/http/jwt-authentication.guard';
import { AuthenticatedUserController } from '../src/authentication/infrastructure/http/authenticated-user.controller';
import { CreateUserRequestPipe } from '../src/authentication/infrastructure/http/create-user-request.pipe';
import { GetAuthenticatedUserParamsPipe } from '../src/authentication/infrastructure/http/get-authenticated-user-params.pipe';

describe('Authentication query HTTP integration', () => {
  const userId = '00000000-0000-0000-0000-000000000010';
  const authenticatedUser: AuthenticatedUserView = {
    id: userId,
    email: 'porter@torre-norte.edificios',
    displayName: 'Carlos Porter',
    status: 'ACTIVE',
    createdAt: '2026-07-10T08:00:00.000Z',
  };

  let app: NestFastifyApplication;
  let getAuthenticatedUserUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    getAuthenticatedUserUseCase = {
      execute: jest.fn().mockResolvedValue(authenticatedUser),
    };

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
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetCurrentUserUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetAuthenticatedUserUseCase,
          useValue: getAuthenticatedUserUseCase,
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/v1/authentication/users/:id', () => {
    it('returns 200 OK with the authenticated user view', async () => {
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

    it('returns 404 when user is not found', async () => {
      getAuthenticatedUserUseCase.execute.mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/authentication/users/${userId}`,
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().message).toBe('User was not found.');
    });

    it('returns 400 when user id is not a valid UUID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/authentication/users/not-a-uuid',
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toBe('User id must be a valid UUID.');
    });

    it('returns the expected authenticated user response shape', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/authentication/users/${userId}`,
      });

      expect(response.json()).toEqual({
        id: expect.any(String),
        email: expect.any(String),
        displayName: expect.any(String),
        status: expect.any(String),
        createdAt: expect.any(String),
      });
    });

    it('normalizes user id to lowercase before executing the use case', async () => {
      const uppercaseUserId = '00000000-0000-0000-0000-0000000000AA';

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/authentication/users/${uppercaseUserId}`,
      });

      expect(response.statusCode).toBe(200);
      expect(getAuthenticatedUserUseCase.execute).toHaveBeenCalledWith({
        userId: uppercaseUserId.toLowerCase(),
      });
    });

    it('trims surrounding whitespace from user id before executing the use case', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/authentication/users/%20%20${userId}%20%20`,
      });

      expect(response.statusCode).toBe(200);
      expect(getAuthenticatedUserUseCase.execute).toHaveBeenCalledWith({
        userId,
      });
    });
  });
});
