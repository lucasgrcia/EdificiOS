import { Pool } from 'pg';

import {
  NotificationQueryRow,
  toNotificationQueryView,
} from '../../application/map-notification-query-view';
import { NotificationQueryRepository } from '../../application/notification-query-persistence';

export class PostgresNotificationQueryRepository
  implements NotificationQueryRepository
{
  constructor(private readonly pool: Pool) {}

  async findRecent(
    limit: number,
  ): Promise<ReturnType<typeof toNotificationQueryView>[]> {
    const result = await this.pool.query<NotificationQueryRow>(
      `
        SELECT
          id,
          recipient_id,
          type,
          message,
          created_at
        FROM notifications
        ORDER BY created_at DESC
        LIMIT $1
      `,
      [limit],
    );

    return result.rows.map((row) => toNotificationQueryView(row));
  }
}
