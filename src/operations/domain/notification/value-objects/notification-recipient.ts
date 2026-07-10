const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class NotificationRecipient {
  private constructor(private readonly value: string) {}

  static create(value: string): NotificationRecipient {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new Error('Notification recipient is required.');
    }

    if (!UUID_PATTERN.test(trimmed)) {
      throw new Error('Notification recipient must be a valid UUID.');
    }

    return new NotificationRecipient(trimmed.toLowerCase());
  }

  toString(): string {
    return this.value;
  }

  equals(other: NotificationRecipient): boolean {
    return this.value === other.value;
  }
}
