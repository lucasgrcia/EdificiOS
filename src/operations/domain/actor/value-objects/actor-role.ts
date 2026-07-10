const ALLOWED_ACTOR_ROLES = [
  'PORTER',
  'ADMINISTRATOR',
  'SECURITY',
  'TECHNICIAN',
] as const;

export type ActorRoleLevel = (typeof ALLOWED_ACTOR_ROLES)[number];

export class ActorRole {
  private constructor(private readonly value: ActorRoleLevel) {}

  static create(value: string): ActorRole {
    const normalized = value.trim().toUpperCase();

    if (normalized.length === 0) {
      throw new Error('Actor role is required.');
    }

    if (!ALLOWED_ACTOR_ROLES.includes(normalized as ActorRoleLevel)) {
      throw new Error('Actor role is not supported.');
    }

    return new ActorRole(normalized as ActorRoleLevel);
  }

  toString(): string {
    return this.value;
  }

  equals(other: ActorRole): boolean {
    return this.value === other.value;
  }
}
