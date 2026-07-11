import { WorkOrderNotFoundError } from '../domain/work-order/work-order-not-found';
import {
  CreateNotificationCommand,
  CreateNotificationResult,
} from './create-notification-use-case';
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

const WORK_ORDER_STARTED_NOTIFICATION_TYPE = 'WORK_ORDER_STARTED';
const WORK_ORDER_STARTED_NOTIFICATION_CHANNEL = 'IN_APP';
const WORK_ORDER_STARTED_NOTIFICATION_MESSAGE =
  'Comenzó una orden de trabajo asignada a ti.';

export type StartWorkOrderUseCaseDependencies = {
  workOrderRepository: WorkOrderRepository;
  createNotificationUseCase: {
    execute(command: CreateNotificationCommand): Promise<CreateNotificationResult>;
  };
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

    await this.dependencies.createNotificationUseCase.execute({
      recipientId: updatedRecord.actorId,
      type: WORK_ORDER_STARTED_NOTIFICATION_TYPE,
      channel: WORK_ORDER_STARTED_NOTIFICATION_CHANNEL,
      message: WORK_ORDER_STARTED_NOTIFICATION_MESSAGE,
    });

    return toWorkOrderResult(updatedRecord);
  }
}
