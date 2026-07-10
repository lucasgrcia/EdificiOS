const ALLOWED_NOTIFICATION_CHANNELS = ['IN_APP', 'EMAIL', 'PUSH'] as const;

export type NotificationChannelLevel =
  (typeof ALLOWED_NOTIFICATION_CHANNELS)[number];

export class NotificationChannel {
  private constructor(private readonly value: NotificationChannelLevel) {}

  static create(value: string): NotificationChannel {
    const normalized = value.trim().toUpperCase();

    if (
      !ALLOWED_NOTIFICATION_CHANNELS.includes(
        normalized as NotificationChannelLevel,
      )
    ) {
      throw new Error('Notification channel is not supported.');
    }

    return new NotificationChannel(normalized as NotificationChannelLevel);
  }

  toString(): string {
    return this.value;
  }

  equals(other: NotificationChannel): boolean {
    return this.value === other.value;
  }
}
