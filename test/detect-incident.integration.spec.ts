import { DetectIncidentUseCase } from '../src/operations/application/detect-incident-use-case';
import {
  FlowEventRecord,
  IncidentRecord,
  OutboxRecord,
  Transaction,
  TransactionRunner,
} from '../src/operations/application/incident-persistence';

describe('DetectIncidentUseCase integration', () => {
  it('persists Incident, Event, and Outbox in the same transaction', async () => {
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
    });

    const result = await useCase.execute({
      description: 'Carlos detects a leak.',
    });

    expect(openedTransactions).toBe(1);
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
      new Set([transactionId]),
    );
    expect(writes[0].record).toMatchObject({
      currentProjectionState: {
        status: 'DETECTED',
        description: 'Carlos detects a leak.',
        detectedAt: '2026-07-07T15:00:00.000Z',
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
});
