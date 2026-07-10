export class AssetType {
  private constructor(private readonly value: string) {}

  static create(value: string): AssetType {
    if (value.trim().length === 0) {
      throw new Error('Asset type is required.');
    }

    return new AssetType(value.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: AssetType): boolean {
    return this.value === other.value;
  }
}
