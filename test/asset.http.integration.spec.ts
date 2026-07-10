import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';

import { AssetResult } from '../src/operations/application/asset-result';
import { GetAssetByIdUseCase } from '../src/operations/application/get-asset-by-id-use-case';
import { GetActiveShiftUseCase } from '../src/operations/application/get-active-shift-use-case';
import { ListAssetsBySiteUseCase } from '../src/operations/application/list-assets-by-site-use-case';
import { RegisterAssetUseCase } from '../src/operations/application/register-asset-use-case';
import { StartShiftUseCase } from '../src/operations/application/start-shift-use-case';
import { AssetsController } from '../src/operations/infrastructure/http/assets.controller';
import { RegisterAssetRequestPipe } from '../src/operations/infrastructure/http/register-asset-request.pipe';
import { SitesController } from '../src/operations/infrastructure/http/sites.controller';

describe('Asset HTTP integration', () => {
  const siteId = '00000000-0000-0000-0000-000000000010';
  const assetId = '00000000-0000-0000-0000-000000000001';
  const asset: AssetResult = {
    id: assetId,
    siteId,
    name: 'Bomba principal',
    type: 'Bomba',
    manufacturer: 'Grundfos',
    model: 'CR 32-4',
    serialNumber: 'SN-12345',
    location: 'Subsuelo',
    criticality: 'HIGH',
  };
  const secondAsset: AssetResult = {
    id: '00000000-0000-0000-0000-000000000002',
    siteId,
    name: 'Ascensor A',
    type: 'Ascensor',
    manufacturer: null,
    model: null,
    serialNumber: null,
    location: 'Torre B',
    criticality: 'CRITICAL',
  };

  let app: NestFastifyApplication;
  let registerAssetUseCase: { execute: jest.Mock };
  let getAssetByIdUseCase: { execute: jest.Mock };
  let listAssetsBySiteUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    registerAssetUseCase = {
      execute: jest.fn().mockResolvedValue(asset),
    };
    getAssetByIdUseCase = {
      execute: jest.fn().mockResolvedValue(asset),
    };
    listAssetsBySiteUseCase = {
      execute: jest.fn().mockResolvedValue([secondAsset, asset]),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [AssetsController, SitesController],
      providers: [
        RegisterAssetRequestPipe,
        {
          provide: RegisterAssetUseCase,
          useValue: registerAssetUseCase,
        },
        {
          provide: GetAssetByIdUseCase,
          useValue: getAssetByIdUseCase,
        },
        {
          provide: ListAssetsBySiteUseCase,
          useValue: listAssetsBySiteUseCase,
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

  describe('POST /api/v1/operations/assets', () => {
    it('returns 201 Created with the registered asset', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/assets',
        payload: {
          siteId,
          name: 'Bomba principal',
          type: 'Bomba',
          manufacturer: 'Grundfos',
          model: 'CR 32-4',
          serialNumber: 'SN-12345',
          location: 'Subsuelo',
          criticality: 'HIGH',
        },
      });

      expect(response.statusCode).toBe(201);
      expect(response.json()).toEqual(asset);
    });

    it('adapts request body to RegisterAssetUseCase command', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/v1/operations/assets',
        payload: {
          siteId: ` ${siteId} `,
          name: ' Bomba principal ',
          type: ' Bomba ',
          manufacturer: ' Grundfos ',
          model: ' CR 32-4 ',
          serialNumber: ' SN-12345 ',
          location: ' Subsuelo ',
          criticality: 'high',
        },
      });

      expect(registerAssetUseCase.execute).toHaveBeenCalledWith({
        siteId,
        name: 'Bomba principal',
        type: 'Bomba',
        manufacturer: 'Grundfos',
        model: 'CR 32-4',
        serialNumber: 'SN-12345',
        location: 'Subsuelo',
        criticality: 'HIGH',
      });
    });

    it('returns 400 when siteId is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/assets',
        payload: {
          name: 'Bomba principal',
          type: 'Bomba',
          location: 'Subsuelo',
          criticality: 'HIGH',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toBe('Site id is required.');
      expect(registerAssetUseCase.execute).not.toHaveBeenCalled();
    });

    it('returns 400 when criticality is not supported', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/operations/assets',
        payload: {
          siteId,
          name: 'Bomba principal',
          type: 'Bomba',
          location: 'Subsuelo',
          criticality: 'URGENT',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toBe('Criticality is not supported.');
      expect(registerAssetUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/operations/assets/:id', () => {
    it('returns 200 OK with the asset', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/assets/${assetId}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(asset);
      expect(getAssetByIdUseCase.execute).toHaveBeenCalledWith({ assetId });
    });

    it('returns 404 when asset is not found', async () => {
      getAssetByIdUseCase.execute.mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/assets/${assetId}`,
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().message).toBe('Asset was not found.');
    });
  });

  describe('GET /api/v1/operations/sites/:siteId/assets', () => {
    it('returns 200 OK with assets for the site', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/sites/${siteId}/assets`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([secondAsset, asset]);
      expect(listAssetsBySiteUseCase.execute).toHaveBeenCalledWith({ siteId });
    });

    it('returns 200 OK with an empty list when site has no assets', async () => {
      listAssetsBySiteUseCase.execute.mockResolvedValueOnce([]);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/sites/${siteId}/assets`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([]);
    });
  });
});
