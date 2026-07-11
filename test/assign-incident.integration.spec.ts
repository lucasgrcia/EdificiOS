import { AssignIncidentUseCase } from '../src/operations/application/assign-incident-use-case';
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
      now: () => new Date('2026-07-07T15:10:00.000Z'),
    },
    writer: {
      write() {},
    },
  });
}

describe('AssignIncidentUseCase integration', () => {
  const incidentId = '00000000-0000-0000-0000-000000000101';
  const assignedActorId = '00000000-0000-0000-0000-000000000021';
  const detectedIncident: IncidentRecord = {
    id: incidentId,
    description: 'Carlos detects a leak.',
    currentProjectionState: {
      status: 'DETECTED',
      description: 'Carlos detects a leak.',
      detectedAt: '2026-07-07T15:00:00.000Z',
      assetId: '00000000-0000-0000-0000-000000000001',
      shiftId: '00000000-0000-0000-0000-000000000030',
      actorId: '00000000-0000-0000-0000-000000000020',
    },
    createdAt: new Date('2026-07-07T15:00:00.000Z'),
  };

  function createHarness(options?: { incidentExists?: boolean }) {
    const writes: Array<{
      kind: 'Projection' | 'Event' | 'Outbox';
      transactionId: string;
      record: IncidentRecord | FlowEventRecord | OutboxRecord;
    }> = [];
    const createNotificationUseCase = {
      execute: jest.fn().mockResolvedValue({
        notificationId: '00000000-0000-0000-0000-000000000501',
      }),
    };

    const transactionId = 'tx-1';
    const transaction: Transaction = {
      incidents: {
        save: async () => {
          throw new Error('Not expected.');
        },
        findById: async (id) => {
          if (options?.incidentExists === false || id !== incidentId) {
            return null;
          }

          return structuredClone(detectedIncident);
        },
        updateProjection: async (record) => {
          writes.push({ kind: 'Projection', transactionId, record });
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

    const transactionRunner: TransactionRunner = {
      run: async (work) => work(transaction),
    };

    const correlationIdProvider = new CorrelationIdProvider();
    const useCase = new AssignIncidentUseCase({
      transactionRunner,
      idGenerator: {
        generate: jest
          .fn()
          .mockReturnValueOnce('00000000-0000-0000-0000-000000000201')
          .mockReturnValueOnce('00000000-0000-0000-0000-000000000202'),
      },
      clock: {
        now: () => new Date('2026-07-07T15:10:00.000Z'),
      },
      correlationIdProvider,
      logger: createSilentLogger(correlationIdProvider),
      metrics: new ApplicationMetrics(),
      createNotificationUseCase,
    });

    return {
      useCase,
      writes,
      createNotificationUseCase,
    };
  }

  it('persists assign transition in a single transaction', async () => {
    const { useCase, writes } = createHarness();

    const result = await useCase.execute({
      incidentId,
      actorId: assignedActorId,
    });

    expect(result).toEqual({
      incidentId,
      eventId: '00000000-0000-0000-0000-000000000201',
      outboxId: '00000000-0000-0000-0000-000000000202',
    });
    expect(writes.map((write) => write.kind)).toEqual([
      'Projection',
      'Event',
      'Outbox',
    ]);
  });

  describe('Incident assign notification integration', () => {
    it('creates a notification when incident assign succeeds', async () => {
      const { useCase, createNotificationUseCase } = createHarness();

      await useCase.execute({
        incidentId,
        actorId: assignedActorId,
      });

      expect(createNotificationUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('creates notification for the assigned actor', async () => {
      const { useCase, createNotificationUseCase } = createHarness();

      await useCase.execute({
        incidentId,
        actorId: assignedActorId,
      });

      expect(createNotificationUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: assignedActorId,
        }),
      );
    });

    it('creates notification with type INCIDENT_ASSIGNED', async () => {
      const { useCase, createNotificationUseCase } = createHarness();

      await useCase.execute({
        incidentId,
        actorId: assignedActorId,
      });

      expect(createNotificationUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'INCIDENT_ASSIGNED',
        }),
      );
    });

    it('creates notification with channel IN_APP', async () => {
      const { useCase, createNotificationUseCase } = createHarness();

      await useCase.execute({
        incidentId,
        actorId: assignedActorId,
      });

      expect(createNotificationUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'IN_APP',
        }),
      );
    });

    it('creates notification with the assign message', async () => {
      const { useCase, createNotificationUseCase } = createHarness();

      await useCase.execute({
        incidentId,
        actorId: assignedActorId,
      });

      expect(createNotificationUseCase.execute).toHaveBeenCalledWith({
        recipientId: assignedActorId,
        type: 'INCIDENT_ASSIGNED',
        channel: 'IN_APP',
        message: 'Se te asignó una incidencia.',
      });
    });

    it('does not create a notification when assign fails', async () => {
      const missingHarness = createHarness({ incidentExists: false });

      await expect(
        missingHarness.useCase.execute({
          incidentId: '00000000-0000-0000-0000-000000000099',
          actorId: assignedActorId,
        }),
      ).rejects.toThrow('Incident not found.');

      expect(missingHarness.createNotificationUseCase.execute).not.toHaveBeenCalled();
    });

    it('does not create a notification when assign transition is invalid', async () => {
      const assignedIncident: IncidentRecord = {
        ...detectedIncident,
        currentProjectionState: {
          ...detectedIncident.currentProjectionState,
          status: 'ASSIGNED',
          assignedAt: '2026-07-07T15:05:00.000Z',
          assignedActorId,
        },
      };
      const createNotificationUseCase = {
        execute: jest.fn().mockResolvedValue({
          notificationId: '00000000-0000-0000-0000-000000000501',
        }),
      };
      const transaction: Transaction = {
        incidents: {
          save: async () => {
            throw new Error('Not expected.');
          },
          findById: async () => structuredClone(assignedIncident),
          updateProjection: async () => {
            throw new Error('Not expected.');
          },
        },
        events: {
          save: async () => {
            throw new Error('Not expected.');
          },
        },
        outbox: {
          save: async () => {
            throw new Error('Not expected.');
          },
        },
      };
      const correlationIdProvider = new CorrelationIdProvider();
      const useCase = new AssignIncidentUseCase({
        transactionRunner: {
          run: async (work) => work(transaction),
        },
        idGenerator: {
          generate: jest
            .fn()
            .mockReturnValueOnce('00000000-0000-0000-0000-000000000201')
            .mockReturnValueOnce('00000000-0000-0000-0000-000000000202'),
        },
        clock: {
          now: () => new Date('2026-07-07T15:10:00.000Z'),
        },
        correlationIdProvider,
        logger: createSilentLogger(correlationIdProvider),
        metrics: new ApplicationMetrics(),
        createNotificationUseCase,
      });

      await expect(
        useCase.execute({
          incidentId,
          actorId: '00000000-0000-0000-0000-000000000022',
        }),
      ).rejects.toThrow('Incident can only be assigned from DETECTED status.');

      expect(createNotificationUseCase.execute).not.toHaveBeenCalled();
    });
  });
});
