import { toWorkOrderResult } from './map-work-order';
import { WorkOrderRepository } from './work-order-persistence';
import { WorkOrderResult } from './work-order-result';

export type GetWorkOrderByIdCommand = {
  workOrderId: string;
};

export type GetWorkOrderByIdUseCaseDependencies = {
  workOrderRepository: WorkOrderRepository;
};

export class GetWorkOrderByIdUseCase {
  constructor(
    private readonly dependencies: GetWorkOrderByIdUseCaseDependencies,
  ) {}

  async execute(
    command: GetWorkOrderByIdCommand,
  ): Promise<WorkOrderResult | null> {
    const record = await this.dependencies.workOrderRepository.findById(
      command.workOrderId,
    );

    if (record === null) {
      return null;
    }

    return toWorkOrderResult(record);
  }
}
