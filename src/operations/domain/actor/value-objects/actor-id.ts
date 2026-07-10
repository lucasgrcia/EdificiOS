const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ActorId {
  private constructor(private readonly value: string) {}

  static create(value: string): ActorId {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new Error('Actor id is required.');
    }

    if (!UUID_PATTERN.test(trimmed)) {
      throw new Error('Actor id must be a valid UUID.');
    }

    return new ActorId(trimmed.toLowerCase());
  }

  toString(): string {
    return this.value;
  }

  equals(other: ActorId): boolean {
    return this.value === other.value;
  }
}
