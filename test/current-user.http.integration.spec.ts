import { UnauthorizedException } from '@nestjs/common';
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
import { AuthenticatedUserController } from '../src/authentication/infrastructure/http/authenticated-user.controller';
import { CreateUserRequestPipe } from '../src/authentication/infrastructure/http/create-user-request.pipe';
import { GetAuthenticatedUserParamsPipe } from '../src/authentication/infrastructure/http/get-authenticated-user-params.pipe';
import {
  STUB_USER_ID,
  StubAuthenticationContext,
} from '../src/authentication/infrastructure/http/stub-authentication-context';
import { CreateUserUseCase } from '../src/authentication/application/create-user-use-case';

describe('Current user HTTP integration', () => {
  const authenticatedUser: AuthenticatedUserView = {
    id: STUB_USER_ID,
    email: 'porter@torre-norte.edificios',
    displayName: 'Carlos Porter',
    status: 'ACTIVE',
    createdAt: '2026-07-10T08:00:00.000Z',
  };

  function createGetCurrentUserUseCase(input: {
    authenticationContext: AuthenticationContext;
    getAuthenticatedUserUseCase: GetAuthenticatedUserUseCase;
  }) {
    return new GetCurrentUserUseCase({
      authenticationContext: input.authenticationContext,
      getAuthenticatedUserUseCase: input.getAuthenticatedUserUseCase,
    });
  }

  describe('GetCurrentUserUseCase', () => {
    it('returns the authenticated user view when the user exists', async () => {
      const getAuthenticatedUserUseCase = {
        execute: jest.fn().mockResolvedValue(authenticatedUser),
      };
      const useCase = createGetCurrentUserUseCase({
        authenticationContext: new StubAuthenticationContext(),
        getAuthenticatedUserUseCase:
          getAuthenticatedUserUseCase as unknown as GetAuthenticatedUserUseCase,
      });

      const result = await useCase.execute();

      expect(result).toEqual(authenticatedUser);
      expect(getAuthenticatedUserUseCase.execute).toHaveBeenCalledWith({
        userId: STUB_USER_ID,
      });
    });

    it('throws UnauthorizedException when authentication context returns null', async () => {
      const authenticationContext: AuthenticationContext = {
        getCurrentUserId: () => null,
      };
      const useCase = createGetCurrentUserUseCase({
        authenticationContext,
        getAuthenticatedUserUseCase: {
          execute: jest.fn(),
        } as unknown as GetAuthenticatedUserUseCase,
      });

      await expect(useCase.execute()).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when the user does not exist', async () => {
      const getAuthenticatedUserUseCase = {
        execute: jest.fn().mockResolvedValue(null),
      };
      const useCase = createGetCurrentUserUseCase({
        authenticationContext: new StubAuthenticationContext(),
        getAuthenticatedUserUseCase:
          getAuthenticatedUserUseCase as unknown as GetAuthenticatedUserUseCase,
      });

      await expect(useCase.execute()).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(getAuthenticatedUserUseCase.execute).toHaveBeenCalledWith({
        userId: STUB_USER_ID,
      });
    });
  });

  describe('GET /api/v1/authentication/me', () => {
    let app: NestFastifyApplication;
    let getAuthenticatedUserUseCase: { execute: jest.Mock };
    let authenticationContext: StubAuthenticationContext;

    async function createApp(
      context: AuthenticationContext = new StubAuthenticationContext(),
    ) {
      getAuthenticatedUserUseCase = {
        execute: jest.fn().mockResolvedValue(authenticatedUser),
      };
      authenticationContext = context as StubAuthenticationContext;

      const moduleRef = await Test.createTestingModule({
        controllers: [AuthenticatedUserController],
        providers: [
          CreateUserRequestPipe,
          GetAuthenticatedUserParamsPipe,
          {
            provide: CreateUserUseCase,
            useValue: { execute: jest.fn() },
          },
          {
            provide: GetAuthenticatedUserUseCase,
            useValue: getAuthenticatedUserUseCase,
          },
          {
            provide: AUTHENTICATION_CONTEXT,
            useValue: context,
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
      await app.init();
      await app.getHttpAdapter().getInstance().ready();
    }

    afterEach(async () => {
      await app.close();
    });

    it('returns 200 OK with the current authenticated user', async () => {
      await createApp();

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/authentication/me',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(authenticatedUser);
      expect(getAuthenticatedUserUseCase.execute).toHaveBeenCalledWith({
        userId: STUB_USER_ID,
      });
    });

    it('returns the expected authenticated user response shape', async () => {
      await createApp();

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/authentication/me',
      });

      expect(response.json()).toEqual({
        id: expect.any(String),
        email: expect.any(String),
        displayName: expect.any(String),
        status: expect.any(String),
        createdAt: expect.any(String),
      });
    });

    it('returns 401 when authentication context provides no user id', async () => {
      await createApp({
        getCurrentUserId: () => null,
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/authentication/me',
      });

      expect(response.statusCode).toBe(401);
      expect(getAuthenticatedUserUseCase.execute).not.toHaveBeenCalled();
    });

    it('returns 401 when the authenticated user does not exist', async () => {
      await createApp();
      getAuthenticatedUserUseCase.execute.mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/authentication/me',
      });

      expect(response.statusCode).toBe(401);
      expect(getAuthenticatedUserUseCase.execute).toHaveBeenCalledWith({
        userId: STUB_USER_ID,
      });
    });
  });
});
