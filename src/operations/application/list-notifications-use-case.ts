import { NotificationQueryRepository } from './notification-query-persistence';
import { NotificationView } from './notification-view';

export type ListNotificationsCommand = {
  recipientId: string;
};

export type ListNotificationsUseCaseDependencies = {
  notificationQueryRepository: NotificationQueryRepository;
};

export class ListNotificationsUseCase {
  constructor(
    private readonly dependencies: ListNotificationsUseCaseDependencies,
  ) {}

  async execute(
    command: ListNotificationsCommand,
  ): Promise<NotificationView[]> {
    return this.dependencies.notificationQueryRepository.findByRecipient(
      command.recipientId,
    );
  }
}
