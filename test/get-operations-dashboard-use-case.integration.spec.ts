import { AssetRecord } from '../src/operations/application/asset-persistence';
import { GetOperationsDashboardUseCase } from '../src/operations/application/get-operations-dashboard-use-case';
import { IncidentView } from '../src/operations/application/incident-view';
import { NotificationView } from '../src/operations/application/notification-view';
import { ShiftRecord } from '../src/operations/application/shift-persistence';
import { SiteRecord } from '../src/operations/application/site-persistence';

describe('GetOperationsDashboardUseCase integration', () => {
  const generatedAt = new Date('2026-07-10T12:00:00.000Z');
  const siteA: SiteRecord = {
    id: '00000000-0000-0000-0000-000000000010',
    name: 'Torre Norte',
    address: 'Av. Siempre Viva 742',
    timeZone: 'America/Argentina/Buenos_Aires',
    buildingType: 'Residential',
  };
  const siteB: SiteRecord = {
    id: '00000000-0000-0000-0000-000000000020',
    name: 'Torre Sur',
    address: 'Calle Falsa 123',
    timeZone: 'America/Argentina/Buenos_Aires',
    buildingType: 'Residential',
  };
  const assetA: AssetRecord = {
    id: '00000000-0000-0000-0000-000000000001',
    siteId: siteA.id,
    name: 'Bomba principal',
    type: 'Bomba',
    manufacturer: null,
    model: null,
    serialNumber: null,
    location: 'Subsuelo',
    criticality: 'HIGH',
  };
  const assetB: AssetRecord = {
    id: '00000000-0000-0000-0000-000000000002',
    siteId: siteB.id,
    name: 'Ascensor A',
    type: 'Ascensor',
    manufacturer: null,
    model: null,
    serialNumber: null,
    location: 'Torre B',
    criticality: 'CRITICAL',
  };
  const activeShift: ShiftRecord = {
    id: '00000000-0000-0000-0000-000000000030',
    siteId: siteA.id,
    actorId: '00000000-0000-0000-0000-000000000040',
    type: 'Mañana',
    status: 'OPEN',
    startedAt: new Date('2026-07-10T08:00:00.000Z'),
    endedAt: null,
  };
  const detectedIncident: IncidentView = {
    id: '00000000-0000-0000-0000-000000000101',
    description: 'Carlos detects a leak.',
    status: 'DETECTED',
    detectedAt: '2026-07-07T15:00:00.000Z',
    assetId: assetA.id,
    shiftId: activeShift.id,
    actorId: activeShift.actorId,
    assignedAt: null,
    assignedActorId: null,
    startedAt: null,
    resolvedAt: null,
    createdAt: '2026-07-07T15:00:00.000Z',
  };
  const resolvedIncident: IncidentView = {
    id: '00000000-0000-0000-0000-000000000102',
    description: 'Ascensor reparado.',
    status: 'RESOLVED',
    detectedAt: '2026-07-06T10:00:00.000Z',
    assetId: assetB.id,
    shiftId: '00000000-0000-0000-0000-000000000031',
    actorId: '00000000-0000-0000-0000-000000000041',
    assignedAt: '2026-07-06T10:10:00.000Z',
    assignedActorId: '00000000-0000-0000-0000-000000000041',
    startedAt: '2026-07-06T11:00:00.000Z',
    resolvedAt: '2026-07-06T12:00:00.000Z',
    createdAt: '2026-07-06T10:00:00.000Z',
  };
  const assignedIncident: IncidentView = {
    id: '00000000-0000-0000-0000-000000000103',
    description: 'Falla en ascensor.',
    status: 'ASSIGNED',
    detectedAt: '2026-07-08T09:00:00.000Z',
    assetId: assetB.id,
    shiftId: '00000000-0000-0000-0000-000000000032',
    actorId: '00000000-0000-0000-0000-000000000041',
    assignedAt: '2026-07-08T09:10:00.000Z',
    assignedActorId: '00000000-0000-0000-0000-000000000042',
    startedAt: null,
    resolvedAt: null,
    createdAt: '2026-07-08T09:00:00.000Z',
  };

  const recentEvent = {
    id: '00000000-0000-0000-0000-000000000201',
    incidentId: detectedIncident.id,
    name: 'workflow.flow.detected',
    occurredAt: '2026-07-07T15:00:00.000Z',
    actorId: null,
  };
  const recentWorkOrder = {
    id: '00000000-0000-0000-0000-000000000401',
    incidentId: detectedIncident.id,
    actorId: activeShift.actorId,
    status: 'OPEN',
    description: 'Reparar bomba principal',
    createdAt: '2026-07-07T16:00:00.000Z',
  };
  const recentNotification = {
    id: '00000000-0000-0000-0000-000000000501',
    recipientId: activeShift.actorId,
    type: 'INCIDENT_DETECTED',
    message: 'Se detectó una nueva incidencia.',
    createdAt: '2026-07-07T15:00:05.000Z',
  };
  const actorNotificationOlder: NotificationView = {
    id: '00000000-0000-0000-0000-000000000601',
    recipientId: activeShift.actorId,
    type: 'INCIDENT_DETECTED',
    channel: 'IN_APP',
    status: 'PENDING',
    message: 'Se detectó una nueva incidencia.',
    createdAt: '2026-07-07T15:00:05.000Z',
  };
  const actorNotificationNewer: NotificationView = {
    id: '00000000-0000-0000-0000-000000000602',
    recipientId: activeShift.actorId,
    type: 'INCIDENT_ASSIGNED',
    channel: 'IN_APP',
    status: 'SENT',
    message: 'Se te asignó una incidencia.',
    createdAt: '2026-07-07T16:00:00.000Z',
  };

  function createUseCase(options?: {
    sites?: SiteRecord[];
    incidents?: IncidentView[];
    assetsBySite?: Record<string, AssetRecord[]>;
    activeShiftsBySite?: Record<string, ShiftRecord[]>;
    recentEvents?: typeof recentEvent[];
    recentWorkOrders?: typeof recentWorkOrder[];
    recentNotifications?: typeof recentNotification[];
    actorNotifications?: NotificationView[];
    findByRecipient?: jest.Mock;
  }) {
    const sites = options?.sites ?? [siteA, siteB];
    const incidents = options?.incidents ?? [
      detectedIncident,
      resolvedIncident,
      assignedIncident,
    ];
    const assetsBySite = options?.assetsBySite ?? {
      [siteA.id]: [assetA],
      [siteB.id]: [assetB],
    };
    const activeShiftsBySite = options?.activeShiftsBySite ?? {
      [siteA.id]: [activeShift],
      [siteB.id]: [],
    };

    return new GetOperationsDashboardUseCase({
      siteRepository: {
        save: async () => {
          throw new Error('Not expected.');
        },
        findById: async () => null,
        findAll: async () => sites,
      },
      assetRepository: {
        findById: async () => null,
        findBySite: async (siteId) => assetsBySite[siteId] ?? [],
        save: async () => {
          throw new Error('Not expected.');
        },
      },
      shiftRepository: {
        findById: async () => null,
        findActiveBySite: async (siteId) => activeShiftsBySite[siteId] ?? [],
        save: async () => {
          throw new Error('Not expected.');
        },
        update: async () => {
          throw new Error('Not expected.');
        },
      },
      incidentQueryRepository: {
        findById: async () => null,
        findAll: async () => incidents,
      },
      eventQueryRepository: {
        findRecent: async () => options?.recentEvents ?? [recentEvent],
      },
      workOrderQueryRepository: {
        findRecent: async () => options?.recentWorkOrders ?? [recentWorkOrder],
      },
      notificationQueryRepository: {
        findById: async () => null,
        findByRecipient:
          options?.findByRecipient ??
          jest.fn(async () => options?.actorNotifications ?? []),
        findRecent: async () =>
          options?.recentNotifications ?? [recentNotification],
      },
      clock: {
        now: () => generatedAt,
      },
    });
  }

  it('builds an operational dashboard from existing repositories', async () => {
    const useCase = createUseCase();

    const result = await useCase.execute();

    expect(result.generatedAt).toBe('2026-07-10T12:00:00.000Z');
    expect(result.summary).toEqual({
      totalSites: 2,
      totalAssets: 2,
      activeShifts: 1,
      openIncidents: 2,
      inProgressIncidents: 0,
      resolvedToday: 0,
      openWorkOrders: 1,
      completedToday: 0,
      pendingNotifications: 1,
    });
    expect(result.totals).toEqual({
      sites: 2,
      incidents: {
        detected: 1,
        assigned: 1,
        inProgress: 0,
        resolved: 1,
      },
    });
    expect(result.sites).toEqual([
      {
        id: siteA.id,
        name: siteA.name,
        activeShift: {
          id: activeShift.id,
          actorId: activeShift.actorId,
          type: activeShift.type,
          startedAt: '2026-07-10T08:00:00.000Z',
        },
        incidents: {
          detected: 1,
          assigned: 0,
          inProgress: 0,
          resolved: 0,
        },
      },
      {
        id: siteB.id,
        name: siteB.name,
        activeShift: null,
        incidents: {
          detected: 0,
          assigned: 1,
          inProgress: 0,
          resolved: 1,
        },
      },
    ]);
    expect(result.openIncidents).toEqual([
      assignedIncident,
      detectedIncident,
    ]);
    expect(result.recentEvents).toEqual([recentEvent]);
    expect(result.recentIncidents).toEqual([
      detectedIncident,
      resolvedIncident,
      assignedIncident,
    ]);
    expect(result.recentWorkOrders).toEqual([recentWorkOrder]);
    expect(result.recentNotifications).toEqual([recentNotification]);
    expect(result.notifications).toEqual([]);
  });

  it('returns empty summaries when there are no sites', async () => {
    const useCase = createUseCase({
      sites: [],
      incidents: [],
      recentEvents: [],
      recentWorkOrders: [],
      recentNotifications: [],
    });

    const result = await useCase.execute();

    expect(result.totals.sites).toBe(0);
    expect(result.summary).toEqual({
      totalSites: 0,
      totalAssets: 0,
      activeShifts: 0,
      openIncidents: 0,
      inProgressIncidents: 0,
      resolvedToday: 0,
      openWorkOrders: 0,
      completedToday: 0,
      pendingNotifications: 0,
    });
    expect(result.sites).toEqual([]);
    expect(result.openIncidents).toEqual([]);
    expect(result.recentEvents).toEqual([]);
    expect(result.recentIncidents).toEqual([]);
    expect(result.recentWorkOrders).toEqual([]);
    expect(result.recentNotifications).toEqual([]);
    expect(result.notifications).toEqual([]);
    expect(result.activityFeed).toEqual([]);
  });

  it('builds dashboard summary from existing read models', async () => {
    const inProgressIncident: IncidentView = {
      id: '00000000-0000-0000-0000-000000000104',
      description: 'Bomba en reparación.',
      status: 'IN_PROGRESS',
      detectedAt: '2026-07-10T08:00:00.000Z',
      assetId: assetA.id,
      shiftId: activeShift.id,
      actorId: activeShift.actorId,
      assignedAt: '2026-07-10T08:10:00.000Z',
      assignedActorId: activeShift.actorId,
      startedAt: '2026-07-10T09:00:00.000Z',
      resolvedAt: null,
      createdAt: '2026-07-10T08:00:00.000Z',
    };
    const resolvedTodayIncident: IncidentView = {
      ...resolvedIncident,
      id: '00000000-0000-0000-0000-000000000105',
      resolvedAt: '2026-07-10T11:30:00.000Z',
    };
    const useCase = createUseCase({
      incidents: [
        detectedIncident,
        assignedIncident,
        inProgressIncident,
        resolvedTodayIncident,
      ],
      recentWorkOrders: [
        recentWorkOrder,
        {
          id: '00000000-0000-0000-0000-000000000402',
          incidentId: inProgressIncident.id,
          actorId: activeShift.actorId,
          status: 'IN_PROGRESS',
          description: 'Reparación en curso',
          createdAt: '2026-07-10T09:30:00.000Z',
        },
        {
          id: '00000000-0000-0000-0000-000000000403',
          incidentId: resolvedTodayIncident.id,
          actorId: activeShift.actorId,
          status: 'COMPLETED',
          description: 'Reparación finalizada',
          createdAt: '2026-07-10T11:45:00.000Z',
        },
      ],
      recentNotifications: [
        recentNotification,
        {
          id: '00000000-0000-0000-0000-000000000502',
          recipientId: activeShift.actorId,
          type: 'INCIDENT_ASSIGNED',
          message: 'Se te asignó una incidencia.',
          createdAt: '2026-07-10T10:00:00.000Z',
        },
      ],
    });

    const result = await useCase.execute();

    expect(result.summary).toEqual({
      totalSites: 2,
      totalAssets: 2,
      activeShifts: 1,
      openIncidents: 3,
      inProgressIncidents: 1,
      resolvedToday: 1,
      openWorkOrders: 1,
      completedToday: 1,
      pendingNotifications: 2,
    });
  });

  it('counts pending notifications for the selected actor in summary', async () => {
    const useCase = createUseCase({
      actorNotifications: [
        actorNotificationOlder,
        {
          ...actorNotificationNewer,
          status: 'PENDING',
        },
      ],
    });

    const result = await useCase.execute({ actorId: activeShift.actorId });

    expect(result.summary.pendingNotifications).toBe(2);
  });

  it('returns actor notifications when actorId is provided', async () => {
    const actorNotifications = [actorNotificationNewer, actorNotificationOlder];
    const findByRecipient = jest.fn(async () => actorNotifications);
    const useCase = createUseCase({
      actorNotifications,
      findByRecipient,
    });

    const result = await useCase.execute({ actorId: activeShift.actorId });

    expect(findByRecipient).toHaveBeenCalledWith(activeShift.actorId);
    expect(result.notifications).toEqual(actorNotifications);
  });

  it('returns actor notifications ordered by createdAt desc', async () => {
    const useCase = createUseCase({
      actorNotifications: [actorNotificationNewer, actorNotificationOlder],
    });

    const result = await useCase.execute({ actorId: activeShift.actorId });

    expect(result.notifications).toEqual([
      actorNotificationNewer,
      actorNotificationOlder,
    ]);
    expect(
      new Date(result.notifications[0].createdAt).getTime(),
    ).toBeGreaterThan(new Date(result.notifications[1].createdAt).getTime());
  });

  it('returns an empty notifications list when actor has no notifications', async () => {
    const findByRecipient = jest.fn(async () => []);
    const useCase = createUseCase({ findByRecipient });

    const result = await useCase.execute({
      actorId: '00000000-0000-0000-0000-000000000099',
    });

    expect(findByRecipient).toHaveBeenCalledWith(
      '00000000-0000-0000-0000-000000000099',
    );
    expect(result.notifications).toEqual([]);
  });

  it('returns an empty notifications list when actorId is not provided', async () => {
    const findByRecipient = jest.fn(async () => [actorNotificationNewer]);
    const useCase = createUseCase({ findByRecipient });

    const result = await useCase.execute();

    expect(findByRecipient).not.toHaveBeenCalled();
    expect(result.notifications).toEqual([]);
  });

  describe('activity feed', () => {
    it('merges recent read models into a unified feed', async () => {
      const useCase = createUseCase();

      const result = await useCase.execute();

      expect(result.activityFeed).toHaveLength(6);
      expect(result.activityFeed).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'EVENT',
            title: recentEvent.name,
            description: recentEvent.name,
          }),
          expect.objectContaining({
            type: 'INCIDENT',
            title: 'Incident',
            description: detectedIncident.description,
          }),
          expect.objectContaining({
            type: 'WORK_ORDER',
            title: 'Work Order',
            description: recentWorkOrder.description,
          }),
          expect.objectContaining({
            type: 'NOTIFICATION',
            title: 'Notification',
            description: recentNotification.message,
          }),
        ]),
      );
    });

    it('orders activity feed by timestamp desc', async () => {
      const useCase = createUseCase();

      const result = await useCase.execute();

      expect(
        result.activityFeed.map((entry) => entry.timestamp.toISOString()),
      ).toEqual([
        '2026-07-08T09:00:00.000Z',
        '2026-07-07T16:00:00.000Z',
        '2026-07-07T15:00:05.000Z',
        '2026-07-07T15:00:00.000Z',
        '2026-07-07T15:00:00.000Z',
        '2026-07-06T10:00:00.000Z',
      ]);
    });

    it('limits activity feed to 20 items', async () => {
      const incidents = Array.from({ length: 10 }, (_, index) => ({
        ...detectedIncident,
        id: `00000000-0000-0000-0000-0000000001${String(index).padStart(2, '0')}`,
        description: `Incident ${index}`,
        detectedAt: `2026-07-10T${String(index).padStart(2, '0')}:00:00.000Z`,
      }));
      const events = Array.from({ length: 10 }, (_, index) => ({
        id: `00000000-0000-0000-0000-0000000002${String(index).padStart(2, '0')}`,
        incidentId: incidents[index].id,
        name: `workflow.flow.event-${index}`,
        occurredAt: `2026-07-09T${String(index).padStart(2, '0')}:00:00.000Z`,
        actorId: null,
      }));
      const workOrders = Array.from({ length: 10 }, (_, index) => ({
        id: `00000000-0000-0000-0000-0000000003${String(index).padStart(2, '0')}`,
        incidentId: incidents[index].id,
        actorId: activeShift.actorId,
        status: 'OPEN',
        description: `Work order ${index}`,
        createdAt: `2026-07-08T${String(index).padStart(2, '0')}:00:00.000Z`,
      }));
      const notifications = Array.from({ length: 10 }, (_, index) => ({
        id: `00000000-0000-0000-0000-0000000004${String(index).padStart(2, '0')}`,
        recipientId: activeShift.actorId,
        type: 'INCIDENT_DETECTED',
        message: `Notification ${index}`,
        createdAt: `2026-07-07T${String(index).padStart(2, '0')}:00:00.000Z`,
      }));
      const useCase = createUseCase({
        incidents,
        recentEvents: events,
        recentWorkOrders: workOrders,
        recentNotifications: notifications,
      });

      const result = await useCase.execute();

      expect(result.activityFeed).toHaveLength(20);
    });

    it('includes all four activity types in the feed', async () => {
      const useCase = createUseCase();

      const result = await useCase.execute();

      expect(new Set(result.activityFeed.map((entry) => entry.type))).toEqual(
        new Set(['EVENT', 'INCIDENT', 'WORK_ORDER', 'NOTIFICATION']),
      );
    });
  });
});
