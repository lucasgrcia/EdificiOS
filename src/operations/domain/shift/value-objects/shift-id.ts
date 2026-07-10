export class ShiftId {
  private constructor(private readonly value: string) {}

  static create(value: string): ShiftId {
    if (value.trim().length === 0) {
      throw new Error('Shift id is required.');
    }

    return new ShiftId(value.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: ShiftId): boolean {
    return this.value === other.value;
  }
}
