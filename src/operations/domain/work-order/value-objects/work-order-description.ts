export class WorkOrderDescription {
  private constructor(private readonly value: string) {}

  static create(value: string): WorkOrderDescription {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new Error('Work order description is required.');
    }

    return new WorkOrderDescription(trimmed);
  }

  toString(): string {
    return this.value;
  }

  equals(other: WorkOrderDescription): boolean {
    return this.value === other.value;
  }
}
