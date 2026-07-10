import { AssetRecord } from '../src/operations/application/asset-persistence';
import { GetIncidentByIdUseCase } from '../src/operations/application/get-incident-by-id-use-case';
import { IncidentQueryRepository } from '../src/operations/application/incident-query-persistence';
import { IncidentView } from '../src/operations/application/incident-view';
import { ListIncidentsUseCase } from '../src/operations/application/list-incidents-use-case';

describe('Incident query use cases integration', () => {
  const siteId = '00000000-0000-0000-0000-000000000010';
  const assetId = '00000000-0000-0000-0000-000000000001';
  const otherAssetId = '00000000-0000-0000-0000-000000000002';
  const shiftId = '00000000-0000-0000-0000-000000000030';
  const actorId = '00000000-0000-0000-0000-000000000020';
  const detectedView: IncidentView = {
    id: '00000000-0000-0000-0000-000000000101',
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
    assetId: otherAssetId,
    shiftId,
    actorId,
    assignedAt: '2026-07-07T16:10:00.000Z',
    assignedActorId: '00000000-0000-0000-0000-000000000021',
    startedAt: null,
    resolvedAt: null,
    createdAt: '2026-07-07T16:00:00.000Z',
  };
  const assets: AssetRecord[] = [
    {
      id: assetId,
      siteId,
      name: 'Bomba principal',
      type: 'Bomba',
      manufacturer: null,
      model: null,
      serialNumber: null,
      location: 'Subsuelo',
      criticality: 'HIGH',
    },
    {
      id: otherAssetId,
      siteId: '00000000-0000-0000-0000-000000000099',
      name: 'Ascensor A',
      type: 'Ascensor',
      manufacturer: null,
      model: null,
      serialNumber: null,
      location: 'Torre B',
      criticality: 'CRITICAL',
    },
  ];

  function createHarness(views: IncidentView[]) {
    const incidentQueryRepository: IncidentQueryRepository = {
      findById: jest.fn(async (id) => views.find((view) => view.id === id) ?? null),
      findAll: jest.fn(async (filters) => {
        return views.filter((view) => {
          if (filters.status !== undefined && view.status !== filters.status) {
            return false;
          }

          if (filters.assetId !== undefined && view.assetId !== filters.assetId) {
            return false;
          }

          if (
            filters.assetIds !== undefined &&
            !filters.assetIds.includes(view.assetId)
          ) {
            return false;
          }

          if (filters.shiftId !== undefined && view.shiftId !== filters.shiftId) {
            return false;
          }

          if (filters.actorId !== undefined && view.actorId !== filters.actorId) {
            return false;
          }

          return true;
        });
      }),
    };

    const assetRepository = {
      findById: jest.fn(async (id: string) => assets.find((asset) => asset.id === id) ?? null),
      findBySite: jest.fn(async (recordSiteId: string) =>
        assets.filter((asset) => asset.siteId === recordSiteId),
      ),
      save: jest.fn(async () => {
        throw new Error('Not expected.');
      }),
    };

    return {
      getIncidentByIdUseCase: new GetIncidentByIdUseCase({
        incidentQueryRepository,
      }),
      listIncidentsUseCase: new ListIncidentsUseCase({
        incidentQueryRepository,
        assetRepository,
      }),
      incidentQueryRepository,
      assetRepository,
    };
  }

  it('returns an incident view by id', async () => {
    const harness = createHarness([detectedView, assignedView]);

    const result = await harness.getIncidentByIdUseCase.execute({
      incidentId: detectedView.id,
    });

    expect(result).toEqual(detectedView);
    expect(harness.incidentQueryRepository.findById).toHaveBeenCalledWith(
      detectedView.id,
    );
  });

  it('returns null when incident id does not exist', async () => {
    const harness = createHarness([detectedView]);

    const result = await harness.getIncidentByIdUseCase.execute({
      incidentId: '00000000-0000-0000-0000-000000000099',
    });

    expect(result).toBeNull();
  });

  it('lists incidents using repository filters from projection fields', async () => {
    const harness = createHarness([detectedView, assignedView]);

    const result = await harness.listIncidentsUseCase.execute({
      status: 'DETECTED',
      shiftId,
      actorId,
    });

    expect(result).toEqual([detectedView]);
    expect(harness.incidentQueryRepository.findAll).toHaveBeenCalledWith({
      status: 'DETECTED',
      shiftId,
      actorId,
    });
  });

  it('resolves siteId to assetIds before querying incidents', async () => {
    const harness = createHarness([detectedView, assignedView]);

    const result = await harness.listIncidentsUseCase.execute({
      siteId,
    });

    expect(result).toEqual([detectedView]);
    expect(harness.assetRepository.findBySite).toHaveBeenCalledWith(siteId);
    expect(harness.incidentQueryRepository.findAll).toHaveBeenCalledWith({
      assetIds: [assetId],
    });
  });

  it('returns an empty list when site has no assets', async () => {
    const harness = createHarness([detectedView, assignedView]);

    const result = await harness.listIncidentsUseCase.execute({
      siteId: '00000000-0000-0000-0000-000000000888',
    });

    expect(result).toEqual([]);
    expect(harness.incidentQueryRepository.findAll).not.toHaveBeenCalled();
  });

  it('returns an empty list when assetId does not belong to siteId', async () => {
    const harness = createHarness([detectedView, assignedView]);

    const result = await harness.listIncidentsUseCase.execute({
      siteId,
      assetId: otherAssetId,
    });

    expect(result).toEqual([]);
    expect(harness.incidentQueryRepository.findAll).not.toHaveBeenCalled();
  });

  it('combines siteId and matching assetId before querying incidents', async () => {
    const harness = createHarness([detectedView, assignedView]);

    const result = await harness.listIncidentsUseCase.execute({
      siteId,
      assetId,
    });

    expect(result).toEqual([detectedView]);
    expect(harness.incidentQueryRepository.findAll).toHaveBeenCalledWith({
      assetId,
    });
  });
});
