import { NotificationChannel } from './value-objects/notification-channel';
import { NotificationId } from './value-objects/notification-id';
import { NotificationMessage } from './value-objects/notification-message';
import { NotificationRecipient } from './value-objects/notification-recipient';
import {
  NotificationStatus,
  NotificationStatusLevel,
} from './value-objects/notification-status';
import { NotificationType } from './value-objects/notification-type';

export type CreateNotificationInput = {
  notificationId: string;
  type: string;
  channel: string;
  message: string;
  recipient: string;
};

export type RehydrateNotificationInput = {
  notificationId: string;
  type: string;
  channel: string;
  message: string;
  recipient: string;
  status: NotificationStatusLevel;
};

export class NotificationAggregate {
  private constructor(
    private readonly notificationIdentifier: NotificationId,
    private readonly notificationType: NotificationType,
    private readonly notificationChannel: NotificationChannel,
    private readonly notificationMessage: NotificationMessage,
    private readonly notificationRecipient: NotificationRecipient,
    private readonly notificationStatus: NotificationStatus,
  ) {}

  static create(input: CreateNotificationInput): NotificationAggregate {
    if (input.notificationId.trim().length === 0) {
      throw new Error('Notification id is required.');
    }

    return new NotificationAggregate(
      NotificationId.create(input.notificationId),
      NotificationType.create(input.type),
      NotificationChannel.create(input.channel),
      NotificationMessage.create(input.message),
      NotificationRecipient.create(input.recipient),
      NotificationStatus.pending(),
    );
  }

  static rehydrate(
    input: RehydrateNotificationInput,
  ): NotificationAggregate {
    if (input.notificationId.trim().length === 0) {
      throw new Error('Notification id is required.');
    }

    return new NotificationAggregate(
      NotificationId.create(input.notificationId),
      NotificationType.create(input.type),
      NotificationChannel.create(input.channel),
      NotificationMessage.create(input.message),
      NotificationRecipient.create(input.recipient),
      NotificationStatus.create(input.status),
    );
  }

  get id(): string {
    return this.notificationIdentifier.toString();
  }

  get type(): string {
    return this.notificationType.toString();
  }

  get status(): NotificationStatusLevel {
    return this.notificationStatus.toString() as NotificationStatusLevel;
  }

  get channel(): string {
    return this.notificationChannel.toString();
  }

  get message(): string {
    return this.notificationMessage.toString();
  }

  get recipient(): string {
    return this.notificationRecipient.toString();
  }
}
