import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';

import { DashboardView } from '../src/operations/application/dashboard-view';
import { GetOperationsDashboardUseCase } from '../src/operations/application/get-operations-dashboard-use-case';
import { DashboardController } from '../src/operations/infrastructure/http/dashboard.controller';

describe('Dashboard HTTP integration', () => {
  const dashboard: DashboardView = {
    generatedAt: '2026-07-10T12:00:00.000Z',
    totals: {
      sites: 1,
      incidents: {
        detected: 1,
        assigned: 0,
        inProgress: 0,
        resolved: 0,
      },
    },
    sites: [
      {
        id: '00000000-0000-0000-0000-000000000010',
        name: 'Torre Norte',
        activeShift: {
          id: '00000000-0000-0000-0000-000000000030',
          actorId: '00000000-0000-0000-0000-000000000040',
          type: 'Mañana',
          startedAt: '2026-07-10T08:00:00.000Z',
        },
        incidents: {
          detected: 1,
          assigned: 0,
          inProgress: 0,
          resolved: 0,
        },
      },
    ],
    openIncidents: [
      {
        id: '00000000-0000-0000-0000-000000000101',
        description: 'Carlos detects a leak.',
        status: 'DETECTED',
        detectedAt: '2026-07-07T15:00:00.000Z',
        assetId: '00000000-0000-0000-0000-000000000001',
        shiftId: '00000000-0000-0000-0000-000000000030',
        actorId: '00000000-0000-0000-0000-000000000040',
        assignedAt: null,
        assignedActorId: null,
        startedAt: null,
        resolvedAt: null,
        createdAt: '2026-07-07T15:00:00.000Z',
      },
    ],
  };

  let app: NestFastifyApplication;
  let getOperationsDashboardUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    getOperationsDashboardUseCase = {
      execute: jest.fn().mockResolvedValue(dashboard),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        {
          provide: GetOperationsDashboardUseCase,
          useValue: getOperationsDashboardUseCase,
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

  describe('GET /api/v1/operations/dashboard', () => {
    it('returns 200 OK with the operational dashboard', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/operations/dashboard',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(dashboard);
      expect(getOperationsDashboardUseCase.execute).toHaveBeenCalledWith();
    });

    it('returns 200 OK with an empty dashboard', async () => {
      const emptyDashboard: DashboardView = {
        generatedAt: '2026-07-10T12:00:00.000Z',
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
      };
      getOperationsDashboardUseCase.execute.mockResolvedValueOnce(emptyDashboard);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/operations/dashboard',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(emptyDashboard);
    });
  });
});
