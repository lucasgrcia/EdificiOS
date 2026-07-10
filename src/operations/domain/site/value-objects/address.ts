export class Address {
  private constructor(private readonly value: string) {}

  static create(value: string): Address {
    if (value.trim().length === 0) {
      throw new Error('Address is required.');
    }

    return new Address(value.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: Address): boolean {
    return this.value === other.value;
  }
}
