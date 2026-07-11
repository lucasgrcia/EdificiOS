import { Pool } from 'pg';

import {
  NotificationQueryRow,
  toNotificationView,
} from '../../application/map-notification-view';
import {
  NotificationQueryRow as NotificationRecentQueryRow,
  toNotificationQueryView,
} from '../../application/map-notification-query-view';
import { NotificationQueryRepository } from '../../application/notification-query-persistence';

export class PostgresNotificationQueryRepository
  implements NotificationQueryRepository
{
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<ReturnType<typeof toNotificationView> | null> {
    const result = await this.pool.query<NotificationQueryRow>(
      `
        SELECT
          id,
          recipient_id,
          type,
          channel,
          status,
          message,
          created_at
        FROM notifications
        WHERE id = $1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return toNotificationView(result.rows[0]);
  }

  async findByRecipient(
    recipientId: string,
  ): Promise<ReturnType<typeof toNotificationView>[]> {
    const result = await this.pool.query<NotificationQueryRow>(
      `
        SELECT
          id,
          recipient_id,
          type,
          channel,
          status,
          message,
          created_at
        FROM notifications
        WHERE recipient_id = $1
        ORDER BY created_at DESC
      `,
      [recipientId],
    );

    return result.rows.map((row) => toNotificationView(row));
  }

  async findRecent(
    limit: number,
  ): Promise<ReturnType<typeof toNotificationQueryView>[]> {
    const result = await this.pool.query<NotificationRecentQueryRow>(
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
