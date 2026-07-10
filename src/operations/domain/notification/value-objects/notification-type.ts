export class NotificationType {
  private constructor(private readonly value: string) {}

  static create(value: string): NotificationType {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new Error('Notification type is required.');
    }

    return new NotificationType(trimmed);
  }

  toString(): string {
    return this.value;
  }

  equals(other: NotificationType): boolean {
    return this.value === other.value;
  }
}
