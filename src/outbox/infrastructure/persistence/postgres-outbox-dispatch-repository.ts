import { Pool } from 'pg';

import {
  OutboxDispatchRepository,
} from '../../application/outbox-dispatch-repository';
import { OutboxMessage } from '../../application/outbox-message';

type OutboxRow = {
  id: string;
  aggregate_type: string;
  aggregate_id: string;
  event_id: string;
  correlation_id: string | null;
  payload: Record<string, unknown>;
  status: string;
  retry_count: number;
  created_at: Date;
};

function toOutboxMessage(row: OutboxRow): OutboxMessage {
  return {
    id: row.id,
    aggregateType: row.aggregate_type,
    aggregateId: row.aggregate_id,
    eventId: row.event_id,
    correlationId: row.correlation_id,
    payload: row.payload,
    status: row.status as OutboxMessage['status'],
    retryCount: row.retry_count,
    createdAt: row.created_at,
  };
}

export class PostgresOutboxDispatchRepository implements OutboxDispatchRepository {
  constructor(private readonly pool: Pool) {}

  async claimPending(limit: number): Promise<OutboxMessage[]> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const result = await client.query<OutboxRow>(
        `
          SELECT
            id,
            aggregate_type,
            aggregate_id,
            event_id,
            correlation_id,
            payload,
            status,
            retry_count,
            created_at
          FROM outbox
          WHERE status = 'pending'
          ORDER BY created_at ASC
          LIMIT $1
          FOR UPDATE SKIP LOCKED
        `,
        [limit],
      );

      if (result.rowCount === 0) {
        await client.query('COMMIT');
        return [];
      }

      const ids = result.rows.map((row) => row.id);

      await client.query(
        `
          UPDATE outbox
          SET status = 'processing'
          WHERE id = ANY($1::uuid[])
        `,
        [ids],
      );

      await client.query('COMMIT');

      return result.rows.map(toOutboxMessage);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async markProcessed(id: string, processedAt: Date): Promise<void> {
    await this.pool.query(
      `
        UPDATE outbox
        SET
          status = 'processed',
          processed_at = $2,
          last_error = NULL
        WHERE id = $1
      `,
      [id, processedAt],
    );
  }

  async recordFailure(
    id: string,
    error: string,
    options: { retryCount: number; failedAt: Date; permanent: boolean },
  ): Promise<void> {
    await this.pool.query(
      `
        UPDATE outbox
        SET
          status = $2,
          retry_count = $3,
          last_error = $4,
          processed_at = CASE WHEN $5 THEN $6 ELSE processed_at END
        WHERE id = $1
      `,
      [
        id,
        options.permanent ? 'failed' : 'pending',
        options.retryCount,
        error,
        options.permanent,
        options.failedAt,
      ],
    );
  }
}
