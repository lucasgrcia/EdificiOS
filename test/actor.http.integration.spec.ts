import {
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { createFastifyTestApp } from './support/create-fastify-test-app';

import { ActorResult } from '../src/operations/application/actor-result';
import { GetActorByIdUseCase } from '../src/operations/application/get-actor-by-id-use-case';
import { GetActiveShiftUseCase } from '../src/operations/application/get-active-shift-use-case';
import { GetSiteByIdUseCase } from '../src/operations/application/get-site-by-id-use-case';
import { ListActorsBySiteUseCase } from '../src/operations/application/list-actors-by-site-use-case';
import { ListAssetsBySiteUseCase } from '../src/operations/application/list-assets-by-site-use-case';
import { ListSitesUseCase } from '../src/operations/application/list-sites-use-case';
import { RegisterActorUseCase } from '../src/operations/application/register-actor-use-case';
import { RegisterSiteUseCase } from '../src/operations/application/register-site-use-case';
import { StartShiftUseCase } from '../src/operations/application/start-shift-use-case';
import { ActorsController } from '../src/operations/infrastructure/http/actors.controller';
import { RegisterActorRequestPipe } from '../src/operations/infrastructure/http/register-actor-request.pipe';
import { SitesController } from '../src/operations/infrastructure/http/sites.controller';
import { operationsHttpTestAuthProviders } from './support/operations-http-test-auth';

describe('Actor HTTP integration', () => {
  const siteId = '00000000-0000-0000-0000-000000000010';
  const actorId = '00000000-0000-0000-0000-000000000001';
  const actor: ActorResult = {
    id: actorId,
    siteId,
    name: 'Juan Pérez',
    role: 'PORTER',
    status: 'ACTIVE',
  };
  const secondActor: ActorResult = {
    id: '00000000-0000-0000-0000-000000000002',
    siteId,
    name: 'María López',
    role: 'ADMINISTRATOR',
    status: 'ACTIVE',
  };

  let app: NestFastifyApplication;
  let registerActorUseCase: { execute: jest.Mock };
  let getActorByIdUseCase: { execute: jest.Mock };
  let listActorsBySiteUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    registerActorUseCase = {
      execute: jest.fn().mockResolvedValue(actor),
    };
    getActorByIdUseCase = {
      execute: jest.fn().mockResolvedValue(actor),
    };
    listActorsBySiteUseCase = {
      execute: jest.fn().mockResolvedValue([actor, secondActor]),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [ActorsController, SitesController],
      providers: [
        ...operationsHttpTestAuthProviders,
        RegisterActorRequestPipe,
        {
          provide: RegisterActorUseCase,
          useValue: registerActorUseCase,
        },
        {
          provide: GetActorByIdUseCase,
          useValue: getActorByIdUseCase,
        },
        {
          provide: ListActorsBySiteUseCase,
          useValue: listActorsBySiteUseCase,
        },
        {
          provide: RegisterSiteUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetSiteByIdUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: ListSitesUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: ListAssetsBySiteUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: StartShiftUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: GetActiveShiftUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    app = await createFastifyTestApp(moduleRef);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/v1/operations/actors', () => {
    it('returns 201 Created with the registered actor', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/actors',
        payload: {
          siteId,
          name: 'Juan Pérez',
          role: 'PORTER',
          status: 'ACTIVE',
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual(actor);
    });

    it('adapts request body to RegisterActorUseCase command', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/v1/operations/actors',
        payload: {
          siteId: ` ${siteId} `,
          name: ' Juan Pérez ',
          role: ' porter ',
          status: ' active ',
        },
      });

      expect(registerActorUseCase.execute).toHaveBeenCalledWith({
        siteId,
        name: 'Juan Pérez',
        role: 'PORTER',
        status: 'ACTIVE',
      });
    });

    it('returns 400 when siteId is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/actors',
        payload: {
          name: 'Juan Pérez',
          role: 'PORTER',
          status: 'ACTIVE',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toBe('Site id is required.');
      expect(registerActorUseCase.execute).not.toHaveBeenCalled();
    });

    it('returns 400 when role is not supported', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/actors',
        payload: {
          siteId,
          name: 'Juan Pérez',
          role: 'MANAGER',
          status: 'ACTIVE',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toBe('Actor role is not supported.');
      expect(registerActorUseCase.execute).not.toHaveBeenCalled();
    });

    it('returns 400 when status is not supported', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/actors',
        payload: {
          siteId,
          name: 'Juan Pérez',
          role: 'PORTER',
          status: 'SUSPENDED',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toBe('Actor status is not supported.');
      expect(registerActorUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/operations/actors/:id', () => {
    it('returns 200 OK with the actor', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/actors/${actorId}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(actor);
      expect(getActorByIdUseCase.execute).toHaveBeenCalledWith({ actorId });
    });

    it('returns 404 when actor is not found', async () => {
      getActorByIdUseCase.execute.mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/actors/${actorId}`,
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().message).toBe('Actor was not found.');
    });
  });

  describe('GET /api/v1/operations/sites/:siteId/actors', () => {
    it('returns 200 OK with actors for the site', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/sites/${siteId}/actors`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([actor, secondActor]);
      expect(listActorsBySiteUseCase.execute).toHaveBeenCalledWith({ siteId });
    });

    it('returns 200 OK with an empty list when site has no actors', async () => {
      listActorsBySiteUseCase.execute.mockResolvedValueOnce([]);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/sites/${siteId}/actors`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([]);
    });
  });
});
