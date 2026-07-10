import { WorkOrderNotFoundError } from '../domain/work-order/work-order-not-found';
import {
  rehydrateWorkOrder,
  toWorkOrderRecord,
  toWorkOrderResult,
} from './map-work-order';
import { WorkOrderRepository } from './work-order-persistence';
import { WorkOrderResult } from './work-order-result';

export type StartWorkOrderCommand = {
  workOrderId: string;
};

export type StartWorkOrderUseCaseDependencies = {
  workOrderRepository: WorkOrderRepository;
};

export class StartWorkOrderUseCase {
  constructor(
    private readonly dependencies: StartWorkOrderUseCaseDependencies,
  ) {}

  async execute(command: StartWorkOrderCommand): Promise<WorkOrderResult> {
    const record = await this.dependencies.workOrderRepository.findById(
      command.workOrderId,
    );

    if (record === null) {
      throw new WorkOrderNotFoundError(command.workOrderId);
    }

    const workOrder = rehydrateWorkOrder(record).start();
    const updatedRecord = toWorkOrderRecord(workOrder);

    await this.dependencies.workOrderRepository.update(updatedRecord);

    return toWorkOrderResult(updatedRecord);
  }
}
