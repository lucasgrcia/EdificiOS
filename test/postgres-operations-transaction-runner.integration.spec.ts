import { PostgresOperationsTransactionRunner } from '../src/operations/infrastructure/persistence/postgres-operations-transaction-runner';
import { PostgresOperationsPool } from '../src/operations/infrastructure/persistence/postgres-operations-pool';

describe('PostgresOperationsTransactionRunner integration', () => {
  it('rolls back Incident, Event, and Outbox when a write fails', async () => {
    const queries: string[] = [];
    const failure = new Error('write failed');
    const client = {
      query: jest.fn(async (sql: string) => {
        queries.push(sql.trim());

        if (sql.includes('INSERT INTO events')) {
          throw failure;
        }
      }),
      release: jest.fn(),
    };
    const operationsPool = {
      pool: {
        connect: jest.fn(async () => client),
      },
    } as unknown as PostgresOperationsPool;
    const runner = new PostgresOperationsTransactionRunner(operationsPool);

    await expect(
      runner.run(async (transaction) => {
        await transaction.incidents.save({
          id: '00000000-0000-0000-0000-000000000001',
          description: 'Carlos detects a leak.',
          currentProjectionState: {
            status: 'DETECTED',
            description: 'Carlos detects a leak.',
            detectedAt: '2026-07-07T15:00:00.000Z',
            assetId: '00000000-0000-0000-0000-000000000099',
            shiftId: '00000000-0000-0000-0000-000000000030',
          },
          createdAt: new Date('2026-07-07T15:00:00.000Z'),
        });
        await transaction.events.save({
          id: '00000000-0000-0000-0000-000000000002',
          aggregateType: 'Incident',
          aggregateId: '00000000-0000-0000-0000-000000000001',
          incidentId: '00000000-0000-0000-0000-000000000001',
          name: 'workflow.flow.detected',
          schemaVersion: 1,
          correlationId: null,
          causationId: null,
          actorId: null,
          payload: {
            incidentId: '00000000-0000-0000-0000-000000000001',
            description: 'Carlos detects a leak.',
            detectedAt: '2026-07-07T15:00:00.000Z',
          },
          occurredAt: new Date('2026-07-07T15:00:00.000Z'),
        });
        await transaction.outbox.save({
          id: '00000000-0000-0000-0000-000000000003',
          aggregateType: 'Incident',
          aggregateId: '00000000-0000-0000-0000-000000000001',
          eventId: '00000000-0000-0000-0000-000000000002',
          payload: {
            id: '00000000-0000-0000-0000-000000000002',
            aggregateType: 'Incident',
            aggregateId: '00000000-0000-0000-0000-000000000001',
            incidentId: '00000000-0000-0000-0000-000000000001',
            name: 'workflow.flow.detected',
            schemaVersion: 1,
            correlationId: null,
            causationId: null,
            actorId: null,
            payload: {
              incidentId: '00000000-0000-0000-0000-000000000001',
              description: 'Carlos detects a leak.',
              detectedAt: '2026-07-07T15:00:00.000Z',
            },
            occurredAt: new Date('2026-07-07T15:00:00.000Z'),
          },
          status: 'pending',
          createdAt: new Date('2026-07-07T15:00:00.000Z'),
        });
      }),
    ).rejects.toThrow(failure);

    expect(queries).toEqual([
      'BEGIN',
      expect.stringContaining('INSERT INTO incidents'),
      expect.stringContaining('INSERT INTO events'),
      'ROLLBACK',
    ]);
    expect(queries).not.toContain('COMMIT');
    expect(client.release).toHaveBeenCalledTimes(1);
  });
});
