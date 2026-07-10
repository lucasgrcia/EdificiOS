import { StartedAt } from './started-at';

export class EndedAt {
  private constructor(private readonly value: Date) {}

  static create(value: Date, startedAt: StartedAt): EndedAt {
    const endedAt = new Date(value);

    if (Number.isNaN(endedAt.getTime())) {
      throw new Error('Ended at is required.');
    }

    if (endedAt.getTime() < startedAt.toDate().getTime()) {
      throw new Error('Ended at cannot precede started at.');
    }

    return new EndedAt(endedAt);
  }

  toDate(): Date {
    return new Date(this.value);
  }

  equals(other: EndedAt): boolean {
    return this.value.getTime() === other.value.getTime();
  }
}
