export class EvidenceId {
  private constructor(private readonly value: string) {}

  static create(value: string): EvidenceId {
    if (value.trim().length === 0) {
      throw new Error('Evidence id is required.');
    }

    return new EvidenceId(value.trim());
  }

  toString(): string {
    return this.value;
  }

  equals(other: EvidenceId): boolean {
    return this.value === other.value;
  }
}
