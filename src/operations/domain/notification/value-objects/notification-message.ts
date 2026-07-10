const MAX_NOTIFICATION_MESSAGE_LENGTH = 500;

export class NotificationMessage {
  private constructor(private readonly value: string) {}

  static create(value: string): NotificationMessage {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new Error('Notification message is required.');
    }

    if (trimmed.length > MAX_NOTIFICATION_MESSAGE_LENGTH) {
      throw new Error('Notification message exceeds the maximum length.');
    }

    return new NotificationMessage(trimmed);
  }

  toString(): string {
    return this.value;
  }

  equals(other: NotificationMessage): boolean {
    return this.value === other.value;
  }
}
