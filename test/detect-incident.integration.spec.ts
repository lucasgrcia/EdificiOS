import { AssetNotFoundError } from '../src/operations/domain/asset/asset-not-found';
import { NoActiveShiftError } from '../src/operations/domain/shift/no-active-shift';
import { DetectIncidentUseCase } from '../src/operations/application/detect-incident-use-case';
import { AssetRecord } from '../src/operations/application/asset-persistence';
import { ShiftRecord } from '../src/operations/application/shift-persistence';
import {
  FlowEventRecord,
  IncidentRecord,
  OutboxRecord,
  Transaction,
  TransactionRunner,
} from '../src/operations/application/incident-persistence';
import { CorrelationIdProvider } from '../src/shared/correlation-id';
import { ApplicationLogger } from '../src/shared/logging/application-logger';
import { ApplicationMetrics } from '../src/shared/metrics/application-metrics';

function createSilentLogger(
  correlationIdProvider: CorrelationIdProvider,
): ApplicationLogger {
  return new ApplicationLogger({
    correlationIdProvider,
    clock: {
      now: () => new Date('2026-07-07T15:00:00.000Z'),
    },
    writer: {
      write() {},
    },
  });
}

describe('DetectIncidentUseCase integration', () => {
  const siteId = '00000000-0000-0000-0000-000000000010';
  const assetId = '00000000-0000-0000-0000-000000000001';
  const shiftId = '00000000-0000-0000-0000-000000000030';
  const assetRecord: AssetRecord = {
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
  const activeShift: ShiftRecord = {
    id: shiftId,
    siteId,
    actorId: '00000000-0000-0000-0000-000000000020',
    type: 'Mañana',
    status: 'OPEN',
    startedAt: new Date('2026-07-10T08:00:00.000Z'),
    endedAt: null,
  };

  function createHarness(options?: {
    assetExists?: boolean;
    activeShiftExists?: boolean;
    correlationIdProvider?: CorrelationIdProvider;
  }) {
    const writes: Array<{
      kind: 'Incident' | 'Event' | 'Outbox';
      transactionId: string;
      record: IncidentRecord | FlowEventRecord | OutboxRecord;
    }> = [];
    const createNotificationUseCase = {
      execute: jest.fn().mockResolvedValue({
        notificationId: 'notification-1',
      }),
    };

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
    const correlationIdProvider =
      options?.correlationIdProvider ?? new CorrelationIdProvider();
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
      correlationIdProvider,
      logger: createSilentLogger(correlationIdProvider),
      metrics: new ApplicationMetrics(),
      assetRepository: {
        findById: async (id) =>
          options?.assetExists === false || id !== assetId ? null : assetRecord,
        findBySite: async () => [],
        save: async () => {
          throw new Error('Not expected.');
        },
      },
      shiftRepository: {
        findById: async () => null,
        findActiveBySite: async (recordSiteId) =>
          options?.activeShiftExists === false || recordSiteId !== siteId
            ? []
            : [activeShift],
        save: async () => {
          throw new Error('Not expected.');
        },
        update: async () => {
          throw new Error('Not expected.');
        },
      },
      createNotificationUseCase,
    });

    return {
      useCase,
      writes,
      createNotificationUseCase,
      getOpenedTransactions: () => openedTransactions,
    };
  }

  it('persists Incident, Event, and Outbox when asset and active shift exist', async () => {
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
    expect(writes[0].record).toMatchObject({
      currentProjectionState: {
        status: 'DETECTED',
        description: 'Carlos detects a leak.',
        detectedAt: '2026-07-07T15:00:00.000Z',
        assetId,
        shiftId,
        actorId: activeShift.actorId,
      },
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

  it('does not create an incident when site has no active shift', async () => {
    const { useCase, writes, getOpenedTransactions } = createHarness({
      activeShiftExists: false,
    });

    await expect(
      useCase.execute({
        assetId,
        description: 'Carlos detects a leak.',
      }),
    ).rejects.toBeInstanceOf(NoActiveShiftError);

    expect(getOpenedTransactions()).toBe(0);
    expect(writes).toEqual([]);
  });

  it('resolves actorId from the active shift without client input', async () => {
    const { useCase, writes } = createHarness();

    await useCase.execute({
      assetId,
      description: 'Ascensor detenido entre pisos.',
    });

    expect(writes[0].record).toMatchObject({
      currentProjectionState: {
        assetId,
        shiftId,
        actorId: activeShift.actorId,
        description: 'Ascensor detenido entre pisos.',
      },
    });
  });

  describe('Incident detection notification integration', () => {
    it('creates a notification when incident detection succeeds', async () => {
      const { useCase, createNotificationUseCase } = createHarness();

      await useCase.execute({
        assetId,
        description: 'Carlos detects a leak.',
      });

      expect(createNotificationUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('creates notification for the detection actor', async () => {
      const { useCase, createNotificationUseCase } = createHarness();

      await useCase.execute({
        assetId,
        description: 'Carlos detects a leak.',
      });

      expect(createNotificationUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: activeShift.actorId,
        }),
      );
    });

    it('creates notification with type INCIDENT_DETECTED', async () => {
      const { useCase, createNotificationUseCase } = createHarness();

      await useCase.execute({
        assetId,
        description: 'Carlos detects a leak.',
      });

      expect(createNotificationUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'INCIDENT_DETECTED',
        }),
      );
    });

    it('creates notification with channel IN_APP', async () => {
      const { useCase, createNotificationUseCase } = createHarness();

      await useCase.execute({
        assetId,
        description: 'Carlos detects a leak.',
      });

      expect(createNotificationUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'IN_APP',
        }),
      );
    });

    it('does not create a notification when detection fails', async () => {
      const assetMissingHarness = createHarness({ assetExists: false });
      const noShiftHarness = createHarness({ activeShiftExists: false });

      await expect(
        assetMissingHarness.useCase.execute({
          assetId: '00000000-0000-0000-0000-000000000099',
          description: 'Carlos detects a leak.',
        }),
      ).rejects.toBeInstanceOf(AssetNotFoundError);

      await expect(
        noShiftHarness.useCase.execute({
          assetId,
          description: 'Carlos detects a leak.',
        }),
      ).rejects.toBeInstanceOf(NoActiveShiftError);

      expect(assetMissingHarness.createNotificationUseCase.execute).not.toHaveBeenCalled();
      expect(noShiftHarness.createNotificationUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('Correlation ID propagation', () => {
    const correlationId = '00000000-0000-0000-0000-0000000000c1';
    const secondCorrelationId = '00000000-0000-0000-0000-0000000000c2';

    function getEventWrite(
      writes: Array<{
        kind: 'Incident' | 'Event' | 'Outbox';
        record: IncidentRecord | FlowEventRecord | OutboxRecord;
      }>,
    ): FlowEventRecord {
      const eventWrite = writes.find((write) => write.kind === 'Event');

      if (eventWrite === undefined) {
        throw new Error('Event write not found.');
      }

      return eventWrite.record as FlowEventRecord;
    }

    function getOutboxWrite(
      writes: Array<{
        kind: 'Incident' | 'Event' | 'Outbox';
        record: IncidentRecord | FlowEventRecord | OutboxRecord;
      }>,
    ): OutboxRecord {
      const outboxWrite = writes.find((write) => write.kind === 'Outbox');

      if (outboxWrite === undefined) {
        throw new Error('Outbox write not found.');
      }

      return outboxWrite.record as OutboxRecord;
    }

    it('persists correlationId in Event Log', async () => {
      const correlationIdProvider = new CorrelationIdProvider();
      const { useCase, writes } = createHarness({ correlationIdProvider });

      await correlationIdProvider.runWithCorrelationId(correlationId, () =>
        useCase.execute({
          assetId,
          description: 'Carlos detects a leak.',
        }),
      );

      expect(getEventWrite(writes).correlationId).toBe(correlationId);
    });

    it('persists correlationId in Outbox', async () => {
      const correlationIdProvider = new CorrelationIdProvider();
      const { useCase, writes } = createHarness({ correlationIdProvider });

      await correlationIdProvider.runWithCorrelationId(correlationId, () =>
        useCase.execute({
          assetId,
          description: 'Carlos detects a leak.',
        }),
      );

      expect(getOutboxWrite(writes).correlationId).toBe(correlationId);
    });

    it('uses the same correlationId in Event Log and Outbox', async () => {
      const correlationIdProvider = new CorrelationIdProvider();
      const { useCase, writes } = createHarness({ correlationIdProvider });

      await correlationIdProvider.runWithCorrelationId(correlationId, () =>
        useCase.execute({
          assetId,
          description: 'Carlos detects a leak.',
        }),
      );

      const eventWrite = getEventWrite(writes);
      const outboxWrite = getOutboxWrite(writes);

      expect(eventWrite.correlationId).toBe(correlationId);
      expect(outboxWrite.correlationId).toBe(correlationId);
      expect(outboxWrite.payload.correlationId).toBe(correlationId);
    });

    it('uses different correlationIds for different requests', async () => {
      const firstProvider = new CorrelationIdProvider();
      const secondProvider = new CorrelationIdProvider();
      const firstHarness = createHarness({
        correlationIdProvider: firstProvider,
      });
      const secondHarness = createHarness({
        correlationIdProvider: secondProvider,
      });

      await firstProvider.runWithCorrelationId(correlationId, () =>
        firstHarness.useCase.execute({
          assetId,
          description: 'Carlos detects a leak.',
        }),
      );

      await secondProvider.runWithCorrelationId(secondCorrelationId, () =>
        secondHarness.useCase.execute({
          assetId,
          description: 'Ascensor detenido entre pisos.',
        }),
      );

      expect(getEventWrite(firstHarness.writes).correlationId).toBe(correlationId);
      expect(getEventWrite(secondHarness.writes).correlationId).toBe(
        secondCorrelationId,
      );
    });
  });
});
