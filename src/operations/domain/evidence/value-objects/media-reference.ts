export class MediaReference {
  private constructor(private readonly value: string) {}

  static create(value: string): MediaReference {
    if (value.trim().length === 0) {
      throw new Error('Media reference is required.');
    }

    return new MediaReference(value.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: MediaReference): boolean {
    return this.value === other.value;
  }
}
