import { Pool } from 'pg';

import {
  WorkOrderQueryRow,
  toWorkOrderQueryView,
} from '../../application/map-work-order-query-view';
import { WorkOrderQueryRepository } from '../../application/work-order-query-persistence';

export class PostgresWorkOrderQueryRepository
  implements WorkOrderQueryRepository
{
  constructor(private readonly pool: Pool) {}

  async findRecent(
    limit: number,
  ): Promise<ReturnType<typeof toWorkOrderQueryView>[]> {
    const result = await this.pool.query<WorkOrderQueryRow>(
      `
        SELECT
          id,
          incident_id,
          actor_id,
          status,
          description,
          created_at
        FROM work_orders
        ORDER BY created_at DESC
        LIMIT $1
      `,
      [limit],
    );

    return result.rows.map((row) => toWorkOrderQueryView(row));
  }
}
