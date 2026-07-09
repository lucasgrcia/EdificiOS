export class StorageReference {
  private constructor(private readonly value: string) {}

  static create(value: string): StorageReference {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new Error('Storage reference is required.');
    }

    const normalizedReference = trimmed
      .replace(/\\/g, '/')
      .split('/')
      .filter((segment) => segment.length > 0 && segment !== '.')
      .join('/');

    if (normalizedReference.length === 0) {
      throw new Error('Storage reference is required.');
    }

    if (
      trimmed.startsWith('/') ||
      /^[a-zA-Z]:/.test(trimmed) ||
      normalizedReference.split('/').includes('..')
    ) {
      throw new Error('Storage reference must be a relative path.');
    }

    return new StorageReference(normalizedReference);
  }

  toString(): string {
    return this.value;
  }

  equals(other: StorageReference): boolean {
    return this.value === other.value;
  }
}
