import { AssetRecord } from '../src/operations/application/asset-persistence';
import { GetOperationsDashboardUseCase } from '../src/operations/application/get-operations-dashboard-use-case';
import { IncidentQueryRepository } from '../src/operations/application/incident-query-persistence';
import { IncidentView } from '../src/operations/application/incident-view';
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

  function createUseCase(options?: {
    sites?: SiteRecord[];
    incidents?: IncidentView[];
    assetsBySite?: Record<string, AssetRecord[]>;
    activeShiftsBySite?: Record<string, ShiftRecord[]>;
    recentEvents?: typeof recentEvent[];
    recentWorkOrders?: typeof recentWorkOrder[];
    recentNotifications?: typeof recentNotification[];
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
    expect(result.sites).toEqual([]);
    expect(result.openIncidents).toEqual([]);
    expect(result.recentEvents).toEqual([]);
    expect(result.recentIncidents).toEqual([]);
    expect(result.recentWorkOrders).toEqual([]);
    expect(result.recentNotifications).toEqual([]);
  });
});
