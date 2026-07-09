export class EvidenceCaption {
  private constructor(private readonly value: string) {}

  static create(value: string): EvidenceCaption {
    if (value.trim().length === 0) {
      throw new Error('Evidence caption cannot be empty.');
    }

    return new EvidenceCaption(value.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: EvidenceCaption): boolean {
    return this.value === other.value;
  }
}
