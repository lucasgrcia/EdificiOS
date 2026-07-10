export class AssetId {
  private constructor(private readonly value: string) {}

  static create(value: string): AssetId {
    if (value.trim().length === 0) {
      throw new Error('Asset id is required.');
    }

    return new AssetId(value.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: AssetId): boolean {
    return this.value === other.value;
  }
}
