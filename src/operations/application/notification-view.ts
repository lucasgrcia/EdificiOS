import { NotificationStatusLevel } from '../domain/notification/value-objects/notification-status';

export type NotificationView = {
  id: string;
  recipientId: string;
  type: string;
  channel: string;
  status: NotificationStatusLevel;
  message: string;
  createdAt: string;
};
