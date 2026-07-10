import { NotificationAggregate } from '../domain/notification/notification';
import { Clock, IdGenerator } from './incident-persistence';
import { toNotificationRecord } from './map-notification';
import { NotificationRepository } from './notification-persistence';

export type CreateNotificationCommand = {
  recipientId: string;
  type: string;
  channel: string;
  message: string;
};

export type CreateNotificationResult = {
  notificationId: string;
};

export type CreateNotificationUseCaseDependencies = {
  notificationRepository: NotificationRepository;
  idGenerator: IdGenerator;
  clock: Clock;
};

export class CreateNotificationUseCase {
  constructor(
    private readonly dependencies: CreateNotificationUseCaseDependencies,
  ) {}

  async execute(
    command: CreateNotificationCommand,
  ): Promise<CreateNotificationResult> {
    const notificationId = this.dependencies.idGenerator.generate();
    const createdAt = this.dependencies.clock.now();

    const notification = NotificationAggregate.create({
      notificationId,
      type: command.type,
      channel: command.channel,
      message: command.message,
      recipient: command.recipientId,
    });

    const record = toNotificationRecord(notification, createdAt);
    await this.dependencies.notificationRepository.save(record);

    return { notificationId };
  }
}
