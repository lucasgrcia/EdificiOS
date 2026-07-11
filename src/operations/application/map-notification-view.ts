import { NotificationRecord } from './notification-persistence';
import { NotificationView } from './notification-view';
import { NotificationStatusLevel } from '../domain/notification/value-objects/notification-status';

export type NotificationQueryRow = {
  id: string;
  recipient_id: string;
  type: string;
  channel: string;
  status: string;
  message: string;
  created_at: Date;
};

export function toNotificationViewFromRecord(
  record: NotificationRecord,
): NotificationView {
  return {
    id: record.id,
    recipientId: record.recipientId,
    type: record.type,
    channel: record.channel,
    status: record.status as NotificationStatusLevel,
    message: record.message,
    createdAt: record.createdAt.toISOString(),
  };
}

export function toNotificationView(row: NotificationQueryRow): NotificationView {
  return {
    id: row.id,
    recipientId: row.recipient_id,
    type: row.type,
    channel: row.channel,
    status: row.status as NotificationStatusLevel,
    message: row.message,
    createdAt: row.created_at.toISOString(),
  };
}
