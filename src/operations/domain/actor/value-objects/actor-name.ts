export class ActorName {
  private constructor(private readonly value: string) {}

  static create(value: string): ActorName {
    if (value.trim().length === 0) {
      throw new Error('Actor name is required.');
    }

    return new ActorName(value.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: ActorName): boolean {
    return this.value === other.value;
  }
}
