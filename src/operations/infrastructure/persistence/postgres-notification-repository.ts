import { Pool } from 'pg';

import {
  NotificationRecord,
  NotificationRepository,
} from '../../application/notification-persistence';

export class PostgresNotificationRepository implements NotificationRepository {
  constructor(private readonly pool: Pool) {}

  async save(notification: NotificationRecord): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO notifications (
          id,
          recipient_id,
          type,
          channel,
          status,
          message,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        notification.id,
        notification.recipientId,
        notification.type,
        notification.channel,
        notification.status,
        notification.message,
        notification.createdAt,
      ],
    );
  }

  async findById(id: string): Promise<NotificationRecord | null> {
    const result = await this.pool.query(
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

    return this.toNotificationRecord(result.rows[0]);
  }

  async findByRecipient(recipientId: string): Promise<NotificationRecord[]> {
    const result = await this.pool.query(
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

    return result.rows.map((row) => this.toNotificationRecord(row));
  }

  private toNotificationRecord(row: {
    id: string;
    recipient_id: string;
    type: string;
    channel: string;
    status: string;
    message: string;
    created_at: Date;
  }): NotificationRecord {
    return {
      id: row.id,
      recipientId: row.recipient_id,
      type: row.type,
      channel: row.channel,
      status: row.status,
      message: row.message,
      createdAt: row.created_at,
    };
  }
}
