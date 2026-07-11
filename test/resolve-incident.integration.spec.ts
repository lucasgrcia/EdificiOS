import {
  FlowEventRecord,
  IncidentRecord,
  OutboxRecord,
  Transaction,
  TransactionRunner,
} from '../src/operations/application/incident-persistence';
import { ResolveIncidentUseCase } from '../src/operations/application/resolve-incident-use-case';

describe('ResolveIncidentUseCase integration', () => {
  const incidentId = '00000000-0000-0000-0000-000000000101';
  const actorId = '00000000-0000-0000-0000-000000000020';
  const assignedActorId = '00000000-0000-0000-0000-000000000021';
  const inProgressIncident: IncidentRecord = {
    id: incidentId,
    description: 'Carlos detects a leak.',
    currentProjectionState: {
      status: 'IN_PROGRESS',
      description: 'Carlos detects a leak.',
      detectedAt: '2026-07-07T15:00:00.000Z',
      assetId: '00000000-0000-0000-0000-000000000001',
      shiftId: '00000000-0000-0000-0000-000000000030',
      actorId,
      assignedAt: '2026-07-07T15:10:00.000Z',
      assignedActorId,
      startedAt: '2026-07-07T15:20:00.000Z',
    },
    createdAt: new Date('2026-07-07T15:00:00.000Z'),
  };

  function createHarness(options?: {
    incident?: IncidentRecord | null;
  }) {
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
          if (id !== incidentId) {
            return null;
          }

          if (options?.incident === null) {
            return null;
          }

          return structuredClone(options?.incident ?? inProgressIncident);
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

    const useCase = new ResolveIncidentUseCase({
      transactionRunner,
      idGenerator: {
        generate: jest
          .fn()
          .mockReturnValueOnce('00000000-0000-0000-0000-000000000201')
          .mockReturnValueOnce('00000000-0000-0000-0000-000000000202'),
      },
      clock: {
        now: () => new Date('2026-07-07T15:30:00.000Z'),
      },
      createNotificationUseCase,
    });

    return {
      useCase,
      writes,
      createNotificationUseCase,
    };
  }

  it('persists resolve transition in a single transaction', async () => {
    const { useCase, writes } = createHarness();

    const result = await useCase.execute({ incidentId });

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

  describe('Incident resolve notification integration', () => {
    it('creates a notification when incident resolve succeeds', async () => {
      const { useCase, createNotificationUseCase } = createHarness();

      await useCase.execute({ incidentId });

      expect(createNotificationUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('creates notification for assignedActorId when it exists', async () => {
      const { useCase, createNotificationUseCase } = createHarness();

      await useCase.execute({ incidentId });

      expect(createNotificationUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: assignedActorId,
        }),
      );
    });

    it('creates notification for actorId when assignedActorId does not exist', async () => {
      const { useCase, createNotificationUseCase } = createHarness({
        incident: {
          ...inProgressIncident,
          currentProjectionState: {
            ...inProgressIncident.currentProjectionState,
            assignedActorId: undefined,
          },
        },
      });

      await useCase.execute({ incidentId });

      expect(createNotificationUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: actorId,
        }),
      );
    });

    it('creates notification with type INCIDENT_RESOLVED', async () => {
      const { useCase, createNotificationUseCase } = createHarness();

      await useCase.execute({ incidentId });

      expect(createNotificationUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'INCIDENT_RESOLVED',
        }),
      );
    });

    it('creates notification with channel IN_APP and resolve message', async () => {
      const { useCase, createNotificationUseCase } = createHarness();

      await useCase.execute({ incidentId });

      expect(createNotificationUseCase.execute).toHaveBeenCalledWith({
        recipientId: assignedActorId,
        type: 'INCIDENT_RESOLVED',
        channel: 'IN_APP',
        message: 'La incidencia fue resuelta correctamente.',
      });
    });

    it('does not create a notification when incident is not found', async () => {
      const { useCase, createNotificationUseCase } = createHarness({
        incident: null,
      });

      await expect(
        useCase.execute({
          incidentId: '00000000-0000-0000-0000-000000000099',
        }),
      ).rejects.toThrow('Incident not found.');

      expect(createNotificationUseCase.execute).not.toHaveBeenCalled();
    });

    it('does not create a notification when resolve transition is invalid', async () => {
      const { useCase, createNotificationUseCase } = createHarness({
        incident: {
          ...inProgressIncident,
          currentProjectionState: {
            ...inProgressIncident.currentProjectionState,
            status: 'DETECTED',
            assignedAt: undefined,
            assignedActorId: undefined,
            startedAt: undefined,
          },
        },
      });

      await expect(useCase.execute({ incidentId })).rejects.toThrow(
        'Incident can only be resolved from IN_PROGRESS status.',
      );

      expect(createNotificationUseCase.execute).not.toHaveBeenCalled();
    });
  });
});
