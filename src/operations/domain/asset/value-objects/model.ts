export class Model {
  private constructor(private readonly value: string) {}

  static create(value: string): Model {
    if (value.trim().length === 0) {
      throw new Error('Model cannot be empty.');
    }

    return new Model(value.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: Model): boolean {
    return this.value === other.value;
  }
}
