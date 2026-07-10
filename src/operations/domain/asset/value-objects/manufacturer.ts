export class Manufacturer {
  private constructor(private readonly value: string) {}

  static create(value: string): Manufacturer {
    if (value.trim().length === 0) {
      throw new Error('Manufacturer cannot be empty.');
    }

    return new Manufacturer(value.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: Manufacturer): boolean {
    return this.value === other.value;
  }
}
