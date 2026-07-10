const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class NotificationId {
  private constructor(private readonly value: string) {}

  static create(value: string): NotificationId {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new Error('Notification id is required.');
    }

    if (!UUID_PATTERN.test(trimmed)) {
      throw new Error('Notification id must be a valid UUID.');
    }

    return new NotificationId(trimmed.toLowerCase());
  }

  toString(): string {
    return this.value;
  }

  equals(other: NotificationId): boolean {
    return this.value === other.value;
  }
}
