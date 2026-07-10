export class Location {
  private constructor(private readonly value: string) {}

  static create(value: string): Location {
    if (value.trim().length === 0) {
      throw new Error('Location is required.');
    }

    return new Location(value.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: Location): boolean {
    return this.value === other.value;
  }
}
