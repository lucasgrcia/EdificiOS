import { NotificationAggregate } from '../domain/notification/notification';
import { NotificationRecord } from './notification-persistence';

export function toNotificationRecord(
  notification: NotificationAggregate,
  createdAt: Date,
): NotificationRecord {
  return {
    id: notification.id,
    recipientId: notification.recipient,
    type: notification.type,
    channel: notification.channel,
    status: notification.status,
    message: notification.message,
    createdAt,
  };
}
