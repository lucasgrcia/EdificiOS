import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';

import { GetActiveShiftUseCase } from '../src/operations/application/get-active-shift-use-case';
import { GetSiteByIdUseCase } from '../src/operations/application/get-site-by-id-use-case';
import { ListActorsBySiteUseCase } from '../src/operations/application/list-actors-by-site-use-case';
import { ListAssetsBySiteUseCase } from '../src/operations/application/list-assets-by-site-use-case';
import { ListSitesUseCase } from '../src/operations/application/list-sites-use-case';
import { RegisterSiteUseCase } from '../src/operations/application/register-site-use-case';
import { SiteResult } from '../src/operations/application/site-result';
import { StartShiftUseCase } from '../src/operations/application/start-shift-use-case';
import { RegisterSiteRequestPipe } from '../src/operations/infrastructure/http/register-site-request.pipe';
import { SitesController } from '../src/operations/infrastructure/http/sites.controller';

describe('Site HTTP integration', () => {
  const siteId = '00000000-0000-0000-0000-000000000010';
  const site: SiteResult = {
    id: siteId,
    name: 'Torre B',
    address: 'Av. Corrientes 1234, CABA',
    timeZone: 'America/Argentina/Buenos_Aires',
    buildingType: 'Residencial',
  };
  const secondSite: SiteResult = {
    id: '00000000-0000-0000-0000-000000000020',
    name: 'Edificio Central',
    address: 'Av. Santa Fe 5678, CABA',
    timeZone: 'America/Argentina/Buenos_Aires',
    buildingType: 'Comercial',
  };

  let app: NestFastifyApplication;
  let registerSiteUseCase: { execute: jest.Mock };
  let getSiteByIdUseCase: { execute: jest.Mock };
  let listSitesUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    registerSiteUseCase = {
      execute: jest.fn().mockResolvedValue(site),
    };
    getSiteByIdUseCase = {
      execute: jest.fn().mockResolvedValue(site),
    };
    listSitesUseCase = {
      execute: jest.fn().mockResolvedValue([secondSite, site]),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [SitesController],
      providers: [
        RegisterSiteRequestPipe,
        {
          provide: RegisterSiteUseCase,
          useValue: registerSiteUseCase,
        },
        {
          provide: GetSiteByIdUseCase,
          useValue: getSiteByIdUseCase,
        },
        {
          provide: ListSitesUseCase,
          useValue: listSitesUseCase,
        },
        {
          provide: ListAssetsBySiteUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: ListActorsBySiteUseCase,
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

    app = moduleRef.createNestApplication(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/v1/operations/sites', () => {
    it('returns 201 Created with the registered site', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/sites',
        payload: {
          name: 'Torre B',
          address: 'Av. Corrientes 1234, CABA',
          timeZone: 'America/Argentina/Buenos_Aires',
          buildingType: 'Residencial',
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual(site);
    });

    it('adapts request body to RegisterSiteUseCase command', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/v1/operations/sites',
        payload: {
          name: ' Torre B ',
          address: ' Av. Corrientes 1234, CABA ',
          timeZone: ' America/Argentina/Buenos_Aires ',
          buildingType: ' Residencial ',
        },
      });

      expect(registerSiteUseCase.execute).toHaveBeenCalledWith({
        name: 'Torre B',
        address: 'Av. Corrientes 1234, CABA',
        timeZone: 'America/Argentina/Buenos_Aires',
        buildingType: 'Residencial',
      });
    });

    it('returns 400 when name is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/sites',
        payload: {
          address: 'Av. Corrientes 1234, CABA',
          timeZone: 'America/Argentina/Buenos_Aires',
          buildingType: 'Residencial',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toBe('Site name is required.');
      expect(registerSiteUseCase.execute).not.toHaveBeenCalled();
    });

    it('returns 400 when address is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/sites',
        payload: {
          name: 'Torre B',
          timeZone: 'America/Argentina/Buenos_Aires',
          buildingType: 'Residencial',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toBe('Address is required.');
      expect(registerSiteUseCase.execute).not.toHaveBeenCalled();
    });

    it('returns 400 when timeZone is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/sites',
        payload: {
          name: 'Torre B',
          address: 'Av. Corrientes 1234, CABA',
          buildingType: 'Residencial',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toBe('Time zone is required.');
      expect(registerSiteUseCase.execute).not.toHaveBeenCalled();
    });

    it('returns 400 when buildingType is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/sites',
        payload: {
          name: 'Torre B',
          address: 'Av. Corrientes 1234, CABA',
          timeZone: 'America/Argentina/Buenos_Aires',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toBe('Building type is required.');
      expect(registerSiteUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/operations/sites/:id', () => {
    it('returns 200 OK with the site', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/sites/${siteId}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(site);
      expect(getSiteByIdUseCase.execute).toHaveBeenCalledWith({ siteId });
    });

    it('returns 404 when site is not found', async () => {
      getSiteByIdUseCase.execute.mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/sites/${siteId}`,
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().message).toBe('Site was not found.');
    });
  });

  describe('GET /api/v1/operations/sites', () => {
    it('returns 200 OK with all sites', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/operations/sites',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([secondSite, site]);
      expect(listSitesUseCase.execute).toHaveBeenCalledWith();
    });

    it('returns 200 OK with an empty list when there are no sites', async () => {
      listSitesUseCase.execute.mockResolvedValueOnce([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/operations/sites',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([]);
    });
  });
});
