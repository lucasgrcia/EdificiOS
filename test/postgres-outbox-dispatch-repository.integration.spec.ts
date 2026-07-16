import { OutboxMessage } from '../src/outbox/application/outbox-message';
import { PostgresOutboxDispatchRepository } from '../src/outbox/infrastructure/persistence/postgres-outbox-dispatch-repository';

describe('PostgresOutboxDispatchRepository integration', () => {
  const pendingMessage: OutboxMessage = {
    id: '00000000-0000-0000-0000-000000000001',
    aggregateType: 'Incident',
    aggregateId: '00000000-0000-0000-0000-000000000101',
    eventId: '00000000-0000-0000-0000-000000000201',
    correlationId: '00000000-0000-0000-0000-000000000301',
    payload: {
      name: 'workflow.flow.detected',
      incidentId: '00000000-0000-0000-0000-000000000101',
    },
    status: 'pending',
    retryCount: 0,
    createdAt: new Date('2026-07-10T08:00:00.000Z'),
  };

  type StoredOutbox = {
    id: string;
    aggregate_type: string;
    aggregate_id: string;
    event_id: string;
    correlation_id: string | null;
    payload: Record<string, unknown>;
    status: string;
    retry_count: number;
    created_at: Date;
    processed_at: Date | null;
    last_error: string | null;
  };

  function createHarness(initialRows: StoredOutbox[] = []) {
    const rows = new Map(initialRows.map((row) => [row.id, { ...row }]));
    const queries: Array<{ sql: string; values: unknown[] }> = [];

    const client = {
      query: jest.fn(async (sql: string, values?: unknown[]) => {
        queries.push({ sql: sql.trim(), values: values ?? [] });

        if (sql === 'BEGIN' || sql === 'COMMIT' || sql === 'ROLLBACK') {
          return { rowCount: 0, rows: [] };
        }

        if (sql.includes('SELECT') && sql.includes('FOR UPDATE SKIP LOCKED')) {
          const limit = values?.[0] as number;
          const pending = [...rows.values()]
            .filter((row) => row.status === 'pending')
            .sort(
              (left, right) => left.created_at.getTime() - right.created_at.getTime(),
            )
            .slice(0, limit);

          return { rowCount: pending.length, rows: pending };
        }

        if (sql.includes("SET status = 'processing'")) {
          const ids = values?.[0] as string[];

          for (const id of ids) {
            const row = rows.get(id);

            if (row !== undefined) {
              row.status = 'processing';
            }
          }

          return { rowCount: ids.length, rows: [] };
        }

        if (sql.includes("status = 'processed'")) {
          const [id, processedAt] = values as [string, Date];
          const row = rows.get(id);

          if (row !== undefined) {
            row.status = 'processed';
            row.processed_at = processedAt;
            row.last_error = null;
          }

          return { rowCount: 1, rows: [] };
        }

        if (sql.includes('recordFailure') || sql.includes('retry_count = $3')) {
          const [id, status, retryCount, lastError, permanent, failedAt] =
            values as [string, string, number, string, boolean, Date];
          const row = rows.get(id);

          if (row !== undefined) {
            row.status = status;
            row.retry_count = retryCount;
            row.last_error = lastError;

            if (permanent) {
              row.processed_at = failedAt;
            }
          }

          return { rowCount: 1, rows: [] };
        }

        return { rowCount: 0, rows: [] };
      }),
      release: jest.fn(),
    };

    const pool = {
      connect: jest.fn(async () => client),
      query: client.query,
    };

    return {
      repository: new PostgresOutboxDispatchRepository(pool as never),
      rows,
      queries,
      client,
    };
  }

  it('claims pending messages and marks them as processing', async () => {
    const harness = createHarness([
      {
        id: pendingMessage.id,
        aggregate_type: pendingMessage.aggregateType,
        aggregate_id: pendingMessage.aggregateId,
        event_id: pendingMessage.eventId,
        correlation_id: pendingMessage.correlationId,
        payload: pendingMessage.payload,
        status: 'pending',
        retry_count: 0,
        created_at: pendingMessage.createdAt,
        processed_at: null,
        last_error: null,
      },
    ]);

    const claimed = await harness.repository.claimPending(10);

    expect(claimed).toEqual([
      {
        ...pendingMessage,
        status: 'processing',
      },
    ]);
    expect(harness.rows.get(pendingMessage.id)?.status).toBe('processing');
  });

  it('marks a message as processed', async () => {
    const harness = createHarness([
      {
        id: pendingMessage.id,
        aggregate_type: pendingMessage.aggregateType,
        aggregate_id: pendingMessage.aggregateId,
        event_id: pendingMessage.eventId,
        correlation_id: pendingMessage.correlationId,
        payload: pendingMessage.payload,
        status: 'processing',
        retry_count: 0,
        created_at: pendingMessage.createdAt,
        processed_at: null,
        last_error: null,
      },
    ]);
    const processedAt = new Date('2026-07-10T12:00:00.000Z');

    await harness.repository.markProcessed(pendingMessage.id, processedAt);

    expect(harness.rows.get(pendingMessage.id)).toEqual(
      expect.objectContaining({
        status: 'processed',
        processed_at: processedAt,
        last_error: null,
      }),
    );
  });

  it('records retryable failures as pending', async () => {
    const harness = createHarness([
      {
        id: pendingMessage.id,
        aggregate_type: pendingMessage.aggregateType,
        aggregate_id: pendingMessage.aggregateId,
        event_id: pendingMessage.eventId,
        correlation_id: pendingMessage.correlationId,
        payload: pendingMessage.payload,
        status: 'processing',
        retry_count: 0,
        created_at: pendingMessage.createdAt,
        processed_at: null,
        last_error: null,
      },
    ]);
    const failedAt = new Date('2026-07-10T12:00:00.000Z');

    await harness.repository.recordFailure(pendingMessage.id, 'Temporary error.', {
      retryCount: 1,
      failedAt,
      permanent: false,
    });

    expect(harness.rows.get(pendingMessage.id)).toEqual(
      expect.objectContaining({
        status: 'pending',
        retry_count: 1,
        last_error: 'Temporary error.',
      }),
    );
  });

  it('records permanent failures', async () => {
    const harness = createHarness([
      {
        id: pendingMessage.id,
        aggregate_type: pendingMessage.aggregateType,
        aggregate_id: pendingMessage.aggregateId,
        event_id: pendingMessage.eventId,
        correlation_id: pendingMessage.correlationId,
        payload: pendingMessage.payload,
        status: 'processing',
        retry_count: 2,
        created_at: pendingMessage.createdAt,
        processed_at: null,
        last_error: 'Old error.',
      },
    ]);
    const failedAt = new Date('2026-07-10T12:00:00.000Z');

    await harness.repository.recordFailure(pendingMessage.id, 'Permanent error.', {
      retryCount: 3,
      failedAt,
      permanent: true,
    });

    expect(harness.rows.get(pendingMessage.id)).toEqual(
      expect.objectContaining({
        status: 'failed',
        retry_count: 3,
        last_error: 'Permanent error.',
        processed_at: failedAt,
      }),
    );
  });
});
