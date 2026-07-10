export class SerialNumber {
  private constructor(private readonly value: string) {}

  static create(value: string): SerialNumber {
    if (value.trim().length === 0) {
      throw new Error('Serial number cannot be empty.');
    }

    return new SerialNumber(value.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: SerialNumber): boolean {
    return this.value === other.value;
  }
}
