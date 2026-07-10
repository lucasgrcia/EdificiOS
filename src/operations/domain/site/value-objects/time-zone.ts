export class TimeZone {
  private constructor(private readonly value: string) {}

  static create(value: string): TimeZone {
    if (value.trim().length === 0) {
      throw new Error('Time zone is required.');
    }

    return new TimeZone(value.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: TimeZone): boolean {
    return this.value === other.value;
  }
}
