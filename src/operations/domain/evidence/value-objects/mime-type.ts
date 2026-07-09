const SUPPORTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'video/mp4',
  'audio/mpeg',
] as const;

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

export class MimeType {
  private constructor(private readonly value: SupportedMimeType) {}

  static create(value: string): MimeType {
    const normalized = value.trim().toLowerCase();

    if (
      !SUPPORTED_MIME_TYPES.includes(normalized as SupportedMimeType)
    ) {
      throw new Error('Mime type is not supported.');
    }

    return new MimeType(normalized as SupportedMimeType);
  }

  toString(): string {
    return this.value;
  }

  equals(other: MimeType): boolean {
    return this.value === other.value;
  }
}
