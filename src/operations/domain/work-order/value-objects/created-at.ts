export class CreatedAt {
  private constructor(private readonly value: Date) {}

  static create(value: Date): CreatedAt {
    const createdAt = new Date(value);

    if (Number.isNaN(createdAt.getTime())) {
      throw new Error('Created at is required.');
    }

    return new CreatedAt(createdAt);
  }

  toDate(): Date {
    return new Date(this.value);
  }

  equals(other: CreatedAt): boolean {
    return this.value.getTime() === other.value.getTime();
  }
}
