import { Pool } from 'pg';

import { EventQueryRepository } from '../../application/event-query-persistence';
import {
  EventQueryRow,
  toEventQueryView,
} from '../../application/map-event-query-view';

export class PostgresEventQueryRepository implements EventQueryRepository {
  constructor(private readonly pool: Pool) {}

  async findRecent(limit: number): Promise<ReturnType<typeof toEventQueryView>[]> {
    const result = await this.pool.query<EventQueryRow>(
      `
        SELECT
          id,
          incident_id,
          name,
          actor_id,
          occurred_at
        FROM events
        ORDER BY occurred_at DESC
        LIMIT $1
      `,
      [limit],
    );

    return result.rows.map((row) => toEventQueryView(row));
  }
}
