import { WorkOrderNotFoundError } from '../domain/work-order/work-order-not-found';
import {
  rehydrateWorkOrder,
  toWorkOrderRecord,
  toWorkOrderResult,
} from './map-work-order';
import { WorkOrderRepository } from './work-order-persistence';
import { WorkOrderResult } from './work-order-result';

export type CompleteWorkOrderCommand = {
  workOrderId: string;
};

export type CompleteWorkOrderUseCaseDependencies = {
  workOrderRepository: WorkOrderRepository;
};

export class CompleteWorkOrderUseCase {
  constructor(
    private readonly dependencies: CompleteWorkOrderUseCaseDependencies,
  ) {}

  async execute(command: CompleteWorkOrderCommand): Promise<WorkOrderResult> {
    const record = await this.dependencies.workOrderRepository.findById(
      command.workOrderId,
    );

    if (record === null) {
      throw new WorkOrderNotFoundError(command.workOrderId);
    }

    const workOrder = rehydrateWorkOrder(record).complete();
    const updatedRecord = toWorkOrderRecord(workOrder);

    await this.dependencies.workOrderRepository.update(updatedRecord);

    return toWorkOrderResult(updatedRecord);
  }
}
