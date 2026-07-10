export class BuildingType {
  private constructor(private readonly value: string) {}

  static create(value: string): BuildingType {
    if (value.trim().length === 0) {
      throw new Error('Building type is required.');
    }

    return new BuildingType(value.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: BuildingType): boolean {
    return this.value === other.value;
  }
}
