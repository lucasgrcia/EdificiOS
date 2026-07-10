const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class WorkOrderId {
  private constructor(private readonly value: string) {}

  static create(value: string): WorkOrderId {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new Error('Work order id is required.');
    }

    if (!UUID_PATTERN.test(trimmed)) {
      throw new Error('Work order id must be a valid UUID.');
    }

    return new WorkOrderId(trimmed.toLowerCase());
  }

  toString(): string {
    return this.value;
  }

  equals(other: WorkOrderId): boolean {
    return this.value === other.value;
  }
}
