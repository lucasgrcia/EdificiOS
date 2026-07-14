import type { DashboardNotification } from '../../types/dashboard';
import { EmptyState } from '../EmptyState';
import { NotificationItem } from './NotificationItem';

type NotificationListProps = {
  notifications: DashboardNotification[];
};

export function NotificationList({ notifications }: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <EmptyState
        description="No hay notificaciones pendientes en este momento."
        icon="notifications"
        title="Sin notificaciones"
      />
    );
  }

  return (
    <ul>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          createdAt={notification.createdAt}
          message={notification.message}
          type={notification.type}
        />
      ))}
    </ul>
  );
}
