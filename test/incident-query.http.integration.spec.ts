import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';

import { GetIncidentByIdUseCase } from '../src/operations/application/get-incident-by-id-use-case';
import { GetIncidentTimelineUseCase } from '../src/operations/application/get-incident-timeline-use-case';
import { IncidentView } from '../src/operations/application/incident-view';
import { ListIncidentsUseCase } from '../src/operations/application/list-incidents-use-case';
import { IncidentQueryController } from '../src/operations/infrastructure/http/incident-query.controller';
import { GetIncidentByIdParamsPipe } from '../src/operations/infrastructure/http/get-incident-by-id-params.pipe';
import { ListIncidentsQueryPipe } from '../src/operations/infrastructure/http/list-incidents-query.pipe';

describe('Incident query HTTP integration', () => {
  const siteId = '00000000-0000-0000-0000-000000000010';
  const assetId = '00000000-0000-0000-0000-000000000001';
  const shiftId = '00000000-0000-0000-0000-000000000030';
  const actorId = '00000000-0000-0000-0000-000000000020';
  const incidentId = '00000000-0000-0000-0000-000000000101';
  const detectedView: IncidentView = {
    id: incidentId,
    description: 'Carlos detects a leak.',
    status: 'DETECTED',
    detectedAt: '2026-07-07T15:00:00.000Z',
    assetId,
    shiftId,
    actorId,
    assignedAt: null,
    assignedActorId: null,
    startedAt: null,
    resolvedAt: null,
    createdAt: '2026-07-07T15:00:00.000Z',
  };
  const assignedView: IncidentView = {
    id: '00000000-0000-0000-0000-000000000102',
    description: 'Ascensor detenido entre pisos.',
    status: 'ASSIGNED',
    detectedAt: '2026-07-07T16:00:00.000Z',
    assetId,
    shiftId,
    actorId,
    assignedAt: '2026-07-07T16:10:00.000Z',
    assignedActorId: '00000000-0000-0000-0000-000000000021',
    startedAt: null,
    resolvedAt: null,
    createdAt: '2026-07-07T16:00:00.000Z',
  };

  let app: NestFastifyApplication;
  let listIncidentsUseCase: { execute: jest.Mock };
  let getIncidentByIdUseCase: { execute: jest.Mock };
  let getIncidentTimelineUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    listIncidentsUseCase = {
      execute: jest.fn().mockResolvedValue([detectedView, assignedView]),
    };
    getIncidentByIdUseCase = {
      execute: jest.fn().mockResolvedValue(detectedView),
    };
    getIncidentTimelineUseCase = {
      execute: jest.fn().mockResolvedValue({
        incidentId,
        entries: [
          {
            timestamp: '2026-07-07T15:00:00.000Z',
            type: 'workflow.flow.detected',
            description: 'Carlos detects a leak.',
            actorId: null,
          },
        ],
      }),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [IncidentQueryController],
      providers: [
        ListIncidentsQueryPipe,
        GetIncidentByIdParamsPipe,
        {
          provide: ListIncidentsUseCase,
          useValue: listIncidentsUseCase,
        },
        {
          provide: GetIncidentByIdUseCase,
          useValue: getIncidentByIdUseCase,
        },
        {
          provide: GetIncidentTimelineUseCase,
          useValue: getIncidentTimelineUseCase,
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

  describe('GET /api/v1/operations/incidents', () => {
    it('returns 200 OK with incident views', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/operations/incidents',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([detectedView, assignedView]);
      expect(listIncidentsUseCase.execute).toHaveBeenCalledWith({});
    });

    it('adapts query parameters to ListIncidentsUseCase filters', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/operations/incidents',
        query: {
          status: ' DETECTED ',
          assetId: ` ${assetId} `,
          shiftId: ` ${shiftId} `,
          actorId: ` ${actorId} `,
          siteId: ` ${siteId} `,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(listIncidentsUseCase.execute).toHaveBeenCalledWith({
        status: 'DETECTED',
        assetId,
        shiftId,
        actorId,
        siteId,
      });
    });

    it('returns 400 when status is not supported', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/operations/incidents',
        query: {
          status: 'OPEN',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toBe('Incident status is not supported.');
      expect(listIncidentsUseCase.execute).not.toHaveBeenCalled();
    });

    it('returns 400 when assetId is empty', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/operations/incidents',
        query: {
          assetId: '   ',
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json().message).toBe('Asset id is invalid.');
      expect(listIncidentsUseCase.execute).not.toHaveBeenCalled();
    });

    it('returns 200 OK with an empty list', async () => {
      listIncidentsUseCase.execute.mockResolvedValueOnce([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/operations/incidents',
        query: {
          siteId,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([]);
    });
  });

  describe('GET /api/v1/operations/incidents/:id', () => {
    it('returns 200 OK with the incident view', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/incidents/${incidentId}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(detectedView);
      expect(getIncidentByIdUseCase.execute).toHaveBeenCalledWith({
        incidentId,
      });
    });

    it('returns 404 when incident is not found', async () => {
      getIncidentByIdUseCase.execute.mockResolvedValueOnce(null);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/incidents/${incidentId}`,
      });

      expect(response.statusCode).toBe(404);
      expect(response.json().message).toBe('Incident was not found.');
    });
  });

  describe('GET /api/v1/operations/incidents/:incidentId/timeline', () => {
    it('returns 200 OK with timeline entries only', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/incidents/${incidentId}/timeline`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([
        {
          timestamp: '2026-07-07T15:00:00.000Z',
          type: 'workflow.flow.detected',
          description: 'Carlos detects a leak.',
          actorId: null,
        },
      ]);
      expect(getIncidentTimelineUseCase.execute).toHaveBeenCalledWith({
        incidentId,
      });
    });

    it('returns 200 OK with an empty timeline', async () => {
      getIncidentTimelineUseCase.execute.mockResolvedValueOnce({
        incidentId,
        entries: [],
      });

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/operations/incidents/${incidentId}/timeline`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([]);
    });
  });
});
