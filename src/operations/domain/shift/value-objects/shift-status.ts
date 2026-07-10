const ALLOWED_SHIFT_STATUSES = ['OPEN', 'CLOSED'] as const;

export type ShiftStatusLevel = (typeof ALLOWED_SHIFT_STATUSES)[number];

export class ShiftStatus {
  private constructor(private readonly value: ShiftStatusLevel) {}

  static create(value: string): ShiftStatus {
    const normalized = value.trim().toUpperCase();

    if (!ALLOWED_SHIFT_STATUSES.includes(normalized as ShiftStatusLevel)) {
      throw new Error('Shift status is not supported.');
    }

    return new ShiftStatus(normalized as ShiftStatusLevel);
  }

  static open(): ShiftStatus {
    return new ShiftStatus('OPEN');
  }

  static closed(): ShiftStatus {
    return new ShiftStatus('CLOSED');
  }

  toString(): string {
    return this.value;
  }

  isOpen(): boolean {
    return this.value === 'OPEN';
  }

  isClosed(): boolean {
    return this.value === 'CLOSED';
  }

  equals(other: ShiftStatus): boolean {
    return this.value === other.value;
  }
}
