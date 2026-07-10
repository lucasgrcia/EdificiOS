const ALLOWED_NOTIFICATION_STATUSES = [
  'PENDING',
  'SENT',
  'FAILED',
  'READ',
] as const;

export type NotificationStatusLevel =
  (typeof ALLOWED_NOTIFICATION_STATUSES)[number];

export class NotificationStatus {
  private constructor(private readonly value: NotificationStatusLevel) {}

  static create(value: string): NotificationStatus {
    const normalized = value.trim().toUpperCase();

    if (
      !ALLOWED_NOTIFICATION_STATUSES.includes(
        normalized as NotificationStatusLevel,
      )
    ) {
      throw new Error('Notification status is not supported.');
    }

    return new NotificationStatus(normalized as NotificationStatusLevel);
  }

  static pending(): NotificationStatus {
    return new NotificationStatus('PENDING');
  }

  toString(): string {
    return this.value;
  }

  equals(other: NotificationStatus): boolean {
    return this.value === other.value;
  }
}
