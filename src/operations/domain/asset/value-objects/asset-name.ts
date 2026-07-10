export class AssetName {
  private constructor(private readonly value: string) {}

  static create(value: string): AssetName {
    if (value.trim().length === 0) {
      throw new Error('Asset name is required.');
    }

    return new AssetName(value.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: AssetName): boolean {
    return this.value === other.value;
  }
}
