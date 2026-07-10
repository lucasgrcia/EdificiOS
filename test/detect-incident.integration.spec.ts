import { AssetNotFoundError } from '../src/operations/domain/asset/asset-not-found';
import { DetectIncidentUseCase } from '../src/operations/application/detect-incident-use-case';
import { AssetRecord } from '../src/operations/application/asset-persistence';
import {
  FlowEventRecord,
  IncidentRecord,
  OutboxRecord,
  Transaction,
  TransactionRunner,
} from '../src/operations/application/incident-persistence';

describe('DetectIncidentUseCase integration', () => {
  const assetId = '00000000-0000-0000-0000-000000000001';
  const assetRecord: AssetRecord = {
    id: assetId,
    siteId: '00000000-0000-0000-0000-000000000010',
    name: 'Bomba principal',
    type: 'Bomba',
    manufacturer: 'Grundfos',
    model: 'CR 32-4',
    serialNumber: 'SN-12345',
    location: 'Subsuelo',
    criticality: 'HIGH',
  };

  function createHarness(options?: { assetExists?: boolean }) {
    const writes: Array<{
      kind: 'Incident' | 'Event' | 'Outbox';
      transactionId: string;
      record: IncidentRecord | FlowEventRecord | OutboxRecord;
    }> = [];

    const transactionId = 'tx-1';
    const transaction: Transaction = {
      incidents: {
        save: async (record) => {
          writes.push({ kind: 'Incident', transactionId, record });
        },
        findById: async () => null,
        updateProjection: async () => {
          throw new Error('Not expected.');
        },
      },
      events: {
        save: async (record) => {
          writes.push({ kind: 'Event', transactionId, record });
        },
      },
      outbox: {
        save: async (record) => {
          writes.push({ kind: 'Outbox', transactionId, record });
        },
      },
    };

    let openedTransactions = 0;
    const transactionRunner: TransactionRunner = {
      run: async (work) => {
        openedTransactions += 1;
        return work(transaction);
      },
    };

    const ids = ['incident-1', 'event-1', 'outbox-1'];
    const useCase = new DetectIncidentUseCase({
      transactionRunner,
      idGenerator: {
        generate: () => {
          const id = ids.shift();

          if (id === undefined) {
            throw new Error('No id available.');
          }

          return id;
        },
      },
      clock: {
        now: () => new Date('2026-07-07T15:00:00.000Z'),
      },
      assetRepository: {
        findById: async (id) =>
          options?.assetExists === false || id !== assetId ? null : assetRecord,
        findBySite: async () => [],
        save: async () => {
          throw new Error('Not expected.');
        },
      },
    });

    return { useCase, writes, getOpenedTransactions: () => openedTransactions };
  }

  it('persists Incident, Event, and Outbox when asset exists', async () => {
    const { useCase, writes, getOpenedTransactions } = createHarness();

    const result = await useCase.execute({
      assetId,
      description: 'Carlos detects a leak.',
    });

    expect(getOpenedTransactions()).toBe(1);
    expect(result).toEqual({
      incidentId: 'incident-1',
      eventId: 'event-1',
      outboxId: 'outbox-1',
    });
    expect(writes.map((write) => write.kind)).toEqual([
      'Incident',
      'Event',
      'Outbox',
    ]);
    expect(new Set(writes.map((write) => write.transactionId))).toEqual(
      new Set(['tx-1']),
    );
    expect(writes[0].record).toMatchObject({
      currentProjectionState: {
        status: 'DETECTED',
        description: 'Carlos detects a leak.',
        detectedAt: '2026-07-07T15:00:00.000Z',
        assetId,
      },
    });
    expect(writes[1].record).toMatchObject({
      id: 'event-1',
      aggregateType: 'Incident',
      aggregateId: 'incident-1',
      incidentId: 'incident-1',
      name: 'workflow.flow.detected',
      schemaVersion: 1,
      correlationId: null,
      causationId: null,
      actorId: null,
    });
    expect(writes[2].record).toMatchObject({
      id: 'outbox-1',
      aggregateType: 'Incident',
      aggregateId: 'incident-1',
      eventId: 'event-1',
      status: 'pending',
    });
  });

  it('does not create an incident when asset does not exist', async () => {
    const { useCase, writes, getOpenedTransactions } = createHarness({
      assetExists: false,
    });

    await expect(
      useCase.execute({
        assetId: '00000000-0000-0000-0000-000000000099',
        description: 'Carlos detects a leak.',
      }),
    ).rejects.toBeInstanceOf(AssetNotFoundError);

    expect(getOpenedTransactions()).toBe(0);
    expect(writes).toEqual([]);
  });

  it('keeps the normal detect flow working with a persisted asset reference', async () => {
    const { useCase, writes } = createHarness();

    const result = await useCase.execute({
      assetId,
      description: 'Ascensor detenido entre pisos.',
    });

    expect(result.incidentId).toBe('incident-1');
    expect(writes[0].record).toMatchObject({
      currentProjectionState: {
        assetId,
        description: 'Ascensor detenido entre pisos.',
      },
    });
  });
});
