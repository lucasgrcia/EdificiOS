export class CapturedAt {
  private constructor(private readonly value: Date) {}

  static create(value: Date, asOf: Date = value): CapturedAt {
    const capturedAt = new Date(value);

    if (Number.isNaN(capturedAt.getTime())) {
      throw new Error('Captured at is required.');
    }

    const referenceTime = new Date(asOf);

    if (Number.isNaN(referenceTime.getTime())) {
      throw new Error('Reference time is required.');
    }

    if (capturedAt.getTime() > referenceTime.getTime()) {
      throw new Error('Captured at cannot be in the future.');
    }

    return new CapturedAt(capturedAt);
  }

  toDate(): Date {
    return new Date(this.value);
  }

  equals(other: CapturedAt): boolean {
    return this.value.getTime() === other.value.getTime();
  }
}
