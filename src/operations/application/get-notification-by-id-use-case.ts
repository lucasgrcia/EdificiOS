import { NotificationQueryRepository } from './notification-query-persistence';
import { NotificationView } from './notification-view';

export type GetNotificationByIdCommand = {
  notificationId: string;
};

export type GetNotificationByIdUseCaseDependencies = {
  notificationQueryRepository: NotificationQueryRepository;
};

export class GetNotificationByIdUseCase {
  constructor(
    private readonly dependencies: GetNotificationByIdUseCaseDependencies,
  ) {}

  async execute(
    command: GetNotificationByIdCommand,
  ): Promise<NotificationView | null> {
    return this.dependencies.notificationQueryRepository.findById(
      command.notificationId,
    );
  }
}
