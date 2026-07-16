import {
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { createFastifyTestApp } from './support/create-fastify-test-app';

import { DashboardView } from '../src/operations/application/dashboard-view';
import { GetOperationsDashboardUseCase } from '../src/operations/application/get-operations-dashboard-use-case';
import { NotificationView } from '../src/operations/application/notification-view';
import { DashboardController } from '../src/operations/infrastructure/http/dashboard.controller';
import { operationsHttpTestAuthProviders } from './support/operations-http-test-auth';

describe('Dashboard HTTP integration', () => {
  const dashboard: DashboardView = {
    generatedAt: '2026-07-10T12:00:00.000Z',
    summary: {
      totalSites: 1,
      totalAssets: 1,
      activeShifts: 1,
      openIncidents: 1,
      inProgressIncidents: 0,
      resolvedToday: 0,
      openWorkOrders: 0,
      completedToday: 0,
      pendingNotifications: 0,
    },
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
    recentEvents: [
      {
        id: '00000000-0000-0000-0000-000000000201',
        incidentId: '00000000-0000-0000-0000-000000000101',
        name: 'workflow.flow.detected',
        occurredAt: '2026-07-07T15:00:00.000Z',
        actorId: null,
      },
    ],
    recentIncidents: [
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
    recentWorkOrders: [],
    recentNotifications: [],
    notifications: [],
    activityFeed: [
      {
        timestamp: new Date('2026-07-07T15:00:00.000Z'),
        type: 'EVENT',
        title: 'workflow.flow.detected',
        description: 'workflow.flow.detected',
      },
    ],
  };
  const actorId = '00000000-0000-0000-0000-000000000040';
  const actorNotifications: NotificationView[] = [
    {
      id: '00000000-0000-0000-0000-000000000602',
      recipientId: actorId,
      type: 'INCIDENT_ASSIGNED',
      channel: 'IN_APP',
      status: 'SENT',
      message: 'Se te asignó una incidencia.',
      createdAt: '2026-07-07T16:00:00.000Z',
    },
    {
      id: '00000000-0000-0000-0000-000000000601',
      recipientId: actorId,
      type: 'INCIDENT_DETECTED',
      channel: 'IN_APP',
      status: 'PENDING',
      message: 'Se detectó una nueva incidencia.',
      createdAt: '2026-07-07T15:00:05.000Z',
    },
  ];

  let app: NestFastifyApplication;
  let getOperationsDashboardUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    getOperationsDashboardUseCase = {
      execute: jest.fn().mockResolvedValue(dashboard),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        ...operationsHttpTestAuthProviders,
        {
          provide: GetOperationsDashboardUseCase,
          useValue: getOperationsDashboardUseCase,
        },
      ],
    }).compile();

    app = await createFastifyTestApp(moduleRef);
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
      expect(response.json()).toEqual({
        ...dashboard,
        activityFeed: dashboard.activityFeed.map((entry) => ({
          ...entry,
          timestamp: entry.timestamp.toISOString(),
        })),
      });
      expect(getOperationsDashboardUseCase.execute).toHaveBeenCalledWith();
    });

    it('returns 200 OK with an empty dashboard', async () => {
      const emptyDashboard: DashboardView = {
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
      getOperationsDashboardUseCase.execute.mockResolvedValueOnce(emptyDashboard);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/operations/dashboard',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(emptyDashboard);
    });

    it('returns actor notifications when actorId is provided', async () => {
      const dashboardWithNotifications: DashboardView = {
        ...dashboard,
        notifications: actorNotifications,
      };
      getOperationsDashboardUseCase.execute.mockResolvedValueOnce(
        dashboardWithNotifications,
      );

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/operations/dashboard',
        query: {
          actorId,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().notifications).toEqual(actorNotifications);
      expect(getOperationsDashboardUseCase.execute).toHaveBeenCalledWith({
        actorId,
      });
    });

    it('returns actor notifications ordered by createdAt desc', async () => {
      const dashboardWithNotifications: DashboardView = {
        ...dashboard,
        notifications: actorNotifications,
      };
      getOperationsDashboardUseCase.execute.mockResolvedValueOnce(
        dashboardWithNotifications,
      );

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/operations/dashboard',
        query: {
          actorId,
        },
      });

      const notifications = response.json().notifications as Array<{
        createdAt: string;
      }>;

      expect(
        new Date(notifications[0].createdAt).getTime(),
      ).toBeGreaterThan(new Date(notifications[1].createdAt).getTime());
    });

    it('returns an empty notifications list when actor has no notifications', async () => {
      getOperationsDashboardUseCase.execute.mockResolvedValueOnce({
        ...dashboard,
        notifications: [],
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/operations/dashboard',
        query: {
          actorId,
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().notifications).toEqual([]);
    });

    it('returns an empty notifications list when actorId is not provided', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/operations/dashboard',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().notifications).toEqual([]);
      expect(getOperationsDashboardUseCase.execute).toHaveBeenCalledWith();
    });

    it('returns dashboard summary in the response', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/operations/dashboard',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().summary).toEqual(dashboard.summary);
    });

    it('returns activityFeed in the response', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/operations/dashboard',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().activityFeed).toEqual([
        {
          timestamp: '2026-07-07T15:00:00.000Z',
          type: 'EVENT',
          title: 'workflow.flow.detected',
          description: 'workflow.flow.detected',
        },
      ]);
    });

    it('returns the expected activityFeed response shape', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/operations/dashboard',
      });

      expect(response.json().activityFeed).toEqual([
        {
          timestamp: expect.any(String),
          type: expect.any(String),
          title: expect.any(String),
          description: expect.any(String),
        },
      ]);
    });
  });
});
