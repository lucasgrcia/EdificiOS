export class OperatorId {
  private constructor(private readonly value: string) {}

  static create(value: string): OperatorId {
    if (value.trim().length === 0) {
      throw new Error('Operator id is required.');
    }

    return new OperatorId(value.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: OperatorId): boolean {
    return this.value === other.value;
  }
}
