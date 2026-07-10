import { WorkOrderNotFoundError } from '../domain/work-order/work-order-not-found';
import {
  rehydrateWorkOrder,
  toWorkOrderRecord,
  toWorkOrderResult,
} from './map-work-order';
import { WorkOrderRepository } from './work-order-persistence';
import { WorkOrderResult } from './work-order-result';

export type CancelWorkOrderCommand = {
  workOrderId: string;
};

export type CancelWorkOrderUseCaseDependencies = {
  workOrderRepository: WorkOrderRepository;
};

export class CancelWorkOrderUseCase {
  constructor(
    private readonly dependencies: CancelWorkOrderUseCaseDependencies,
  ) {}

  async execute(command: CancelWorkOrderCommand): Promise<WorkOrderResult> {
    const record = await this.dependencies.workOrderRepository.findById(
      command.workOrderId,
    );

    if (record === null) {
      throw new WorkOrderNotFoundError(command.workOrderId);
    }

    const workOrder = rehydrateWorkOrder(record).cancel();
    const updatedRecord = toWorkOrderRecord(workOrder);

    await this.dependencies.workOrderRepository.update(updatedRecord);

    return toWorkOrderResult(updatedRecord);
  }
}
