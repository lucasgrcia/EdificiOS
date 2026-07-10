const ALLOWED_ACTOR_STATUSES = ['ACTIVE', 'INACTIVE'] as const;

export type ActorStatusLevel = (typeof ALLOWED_ACTOR_STATUSES)[number];

export class ActorStatus {
  private constructor(private readonly value: ActorStatusLevel) {}

  static create(value: string): ActorStatus {
    const normalized = value.trim().toUpperCase();

    if (normalized.length === 0) {
      throw new Error('Actor status is required.');
    }

    if (!ALLOWED_ACTOR_STATUSES.includes(normalized as ActorStatusLevel)) {
      throw new Error('Actor status is not supported.');
    }

    return new ActorStatus(normalized as ActorStatusLevel);
  }

  toString(): string {
    return this.value;
  }

  equals(other: ActorStatus): boolean {
    return this.value === other.value;
  }
}
