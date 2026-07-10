export class SiteId {
  private constructor(private readonly value: string) {}

  static create(value: string): SiteId {
    if (value.trim().length === 0) {
      throw new Error('Site id is required.');
    }

    return new SiteId(value.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: SiteId): boolean {
    return this.value === other.value;
  }
}
