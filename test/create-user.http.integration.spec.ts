import {
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { createFastifyTestApp } from './support/create-fastify-test-app';

import { CreateUserUseCase } from '../src/authentication/application/create-user-use-case';
import {
  AUTHENTICATION_CONTEXT,
  AuthenticationContext,
} from '../src/authentication/application/authentication-context';
import { AuthenticatedUserController } from '../src/authentication/infrastructure/http/authenticated-user.controller';
import { CreateUserRequestPipe } from '../src/authentication/infrastructure/http/create-user-request.pipe';
import { GetAuthenticatedUserParamsPipe } from '../src/authentication/infrastructure/http/get-authenticated-user-params.pipe';
import { GetAuthenticatedUserUseCase } from '../src/authentication/application/get-authenticated-user-use-case';
import { GetCurrentUserUseCase } from '../src/authentication/application/get-current-user-use-case';
import { JwtAuthenticationGuard } from '../src/authentication/infrastructure/http/jwt-authentication.guard';

describe('Create user HTTP integration', () => {
  const userId = '00000000-0000-0000-0000-000000000010';

  let app: NestFastifyApplication;
  let createUserUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    createUserUseCase = {
      execute: jest.fn().mockResolvedValue({ userId }),
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
          useValue: createUserUseCase,
        },
        {
          provide: GetCurrentUserUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetAuthenticatedUserUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    app = await createFastifyTestApp(moduleRef);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/v1/authentication/users', () => {
    it('returns 201 Created with the user id', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/authentication/users',
        payload: {
          email: 'porter@torre-norte.edificios',
          displayName: 'Carlos Porter',
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual({ userId });
    });

    it('normalizes email to lowercase before executing the use case', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/v1/authentication/users',
        payload: {
          email: '  PORTER@Torre-Norte.Edificios  ',
          displayName: 'Carlos Porter',
        },
      });

      expect(createUserUseCase.execute).toHaveBeenCalledWith({
        email: 'porter@torre-norte.edificios',
        displayName: 'Carlos Porter',
      });
    });

    it('trims displayName before executing the use case', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/v1/authentication/users',
        payload: {
          email: 'porter@torre-norte.edificios',
          displayName: '  Carlos Porter  ',
        },
      });

      expect(createUserUseCase.execute).toHaveBeenCalledWith({
        email: 'porter@torre-norte.edificios',
        displayName: 'Carlos Porter',
      });
    });

    it('returns 400 when email is empty', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/authentication/users',
        payload: {
          email: '   ',
          displayName: 'Carlos Porter',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toBe('Email is required.');
    });

    it('returns 400 when displayName is empty', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/authentication/users',
        payload: {
          email: 'porter@torre-norte.edificios',
          displayName: '   ',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toBe('Display name is required.');
    });
  });
});
