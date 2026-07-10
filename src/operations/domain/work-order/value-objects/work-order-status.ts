const ALLOWED_WORK_ORDER_STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;

export type WorkOrderStatusLevel =
  (typeof ALLOWED_WORK_ORDER_STATUSES)[number];

export class WorkOrderStatus {
  private constructor(private readonly value: WorkOrderStatusLevel) {}

  static create(value: string): WorkOrderStatus {
    const normalized = value.trim().toUpperCase();

    if (
      !ALLOWED_WORK_ORDER_STATUSES.includes(normalized as WorkOrderStatusLevel)
    ) {
      throw new Error('Work order status is not supported.');
    }

    return new WorkOrderStatus(normalized as WorkOrderStatusLevel);
  }

  static open(): WorkOrderStatus {
    return new WorkOrderStatus('OPEN');
  }

  static inProgress(): WorkOrderStatus {
    return new WorkOrderStatus('IN_PROGRESS');
  }

  static completed(): WorkOrderStatus {
    return new WorkOrderStatus('COMPLETED');
  }

  static cancelled(): WorkOrderStatus {
    return new WorkOrderStatus('CANCELLED');
  }

  toString(): string {
    return this.value;
  }

  isOpen(): boolean {
    return this.value === 'OPEN';
  }

  isInProgress(): boolean {
    return this.value === 'IN_PROGRESS';
  }

  isCompleted(): boolean {
    return this.value === 'COMPLETED';
  }

  isCancelled(): boolean {
    return this.value === 'CANCELLED';
  }

  equals(other: WorkOrderStatus): boolean {
    return this.value === other.value;
  }
}
