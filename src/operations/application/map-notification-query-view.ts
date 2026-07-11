import { NotificationQueryView } from './notification-query-view';

export type NotificationQueryRow = {
  id: string;
  recipient_id: string;
  type: string;
  message: string;
  created_at: Date;
};

export function toNotificationQueryView(
  row: NotificationQueryRow,
): NotificationQueryView {
  return {
    id: row.id,
    recipientId: row.recipient_id,
    type: row.type,
    message: row.message,
    createdAt: row.created_at.toISOString(),
  };
}
