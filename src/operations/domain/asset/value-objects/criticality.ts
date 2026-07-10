const ALLOWED_CRITICALITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

export type CriticalityLevel = (typeof ALLOWED_CRITICALITIES)[number];

export class Criticality {
  private constructor(private readonly value: CriticalityLevel) {}

  static create(value: string): Criticality {
    const normalized = value.trim().toUpperCase();

    if (
      !ALLOWED_CRITICALITIES.includes(normalized as CriticalityLevel)
    ) {
      throw new Error('Criticality is not supported.');
    }

    return new Criticality(normalized as CriticalityLevel);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Criticality): boolean {
    return this.value === other.value;
  }
}
