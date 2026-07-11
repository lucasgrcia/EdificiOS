import { NotificationQueryView } from './notification-query-view';

export interface NotificationQueryRepository {
  findRecent(limit: number): Promise<NotificationQueryView[]>;
}
