export class ActorId {
  private constructor(private readonly value: string) {}

  static create(value: string): ActorId {
    if (value.trim().length === 0) {
      throw new Error('Actor id is required.');
    }

    return new ActorId(value.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: ActorId): boolean {
    return this.value === other.value;
  }
}
