export class SiteName {
  private constructor(private readonly value: string) {}

  static create(value: string): SiteName {
    if (value.trim().length === 0) {
      throw new Error('Site name is required.');
    }

    return new SiteName(value.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: SiteName): boolean {
    return this.value === other.value;
  }
}
