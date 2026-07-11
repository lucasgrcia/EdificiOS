import { NotificationQueryView } from './notification-query-view';
import { NotificationView } from './notification-view';

export interface NotificationQueryRepository {
  findById(id: string): Promise<NotificationView | null>;
  findByRecipient(recipientId: string): Promise<NotificationView[]>;
  findRecent(limit: number): Promise<NotificationQueryView[]>;
}
