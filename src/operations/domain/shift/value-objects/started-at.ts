export class StartedAt {
  private constructor(private readonly value: Date) {}

  static create(value: Date): StartedAt {
    const startedAt = new Date(value);

    if (Number.isNaN(startedAt.getTime())) {
      throw new Error('Started at is required.');
    }

    return new StartedAt(startedAt);
  }

  toDate(): Date {
    return new Date(this.value);
  }

  equals(other: StartedAt): boolean {
    return this.value.getTime() === other.value.getTime();
  }
}
