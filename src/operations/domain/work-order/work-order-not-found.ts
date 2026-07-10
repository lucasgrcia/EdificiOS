export class WorkOrderNotFoundError extends Error {
  constructor(readonly workOrderId: string) {
    super('Work order was not found.');
    this.name = 'WorkOrderNotFoundError';
  }
}
