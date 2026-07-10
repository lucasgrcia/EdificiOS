export class ShiftType {
  private constructor(private readonly value: string) {}

  static create(value: string): ShiftType {
    if (value.trim().length === 0) {
      throw new Error('Shift type is required.');
    }

    return new ShiftType(value.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: ShiftType): boolean {
    return this.value === other.value;
  }
}
