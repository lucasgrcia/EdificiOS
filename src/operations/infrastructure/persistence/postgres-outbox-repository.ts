import { PoolClient } from 'pg';

import {
  OutboxRecord,
  OutboxRepository,
} from '../../application/incident-persistence';

export class PostgresOutboxRepository implements OutboxRepository {
  constructor(private readonly client: PoolClient) {}

  async save(outbox: OutboxRecord): Promise<void> {
    await this.client.query(
      `
        INSERT INTO outbox (
          id,
          aggregate_type,
          aggregate_id,
          event_id,
          payload,
          status,
          created_at,
          processed_at
        )
        VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, NULL)
      `,
      [
        outbox.id,
        outbox.aggregateType,
        outbox.aggregateId,
        outbox.eventId,
        JSON.stringify(outbox.payload),
        outbox.status,
        outbox.createdAt,
      ],
    );
  }
}
