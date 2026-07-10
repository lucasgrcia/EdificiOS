import { ActorNotFoundError } from '../domain/actor/actor-not-found';
import { IncidentNotFoundError } from '../domain/incident/incident-not-found';
import { OpenWorkOrderAlreadyExistsError } from '../domain/work-order/open-work-order-already-exists';
import { WorkOrderAggregate } from '../domain/work-order/work-order';
import { ActorRepository } from './actor-persistence';
import { Clock, IdGenerator } from './incident-persistence';
import { IncidentQueryRepository } from './incident-query-persistence';
import { toWorkOrderRecord, toWorkOrderResult } from './map-work-order';
import { WorkOrderRepository } from './work-order-persistence';
import { WorkOrderResult } from './work-order-result';

export type CreateWorkOrderCommand = {
  incidentId: string;
  actorId: string;
  description: string;
};

export type CreateWorkOrderUseCaseDependencies = {
  workOrderRepository: WorkOrderRepository;
  actorRepository: ActorRepository;
  incidentQueryRepository: IncidentQueryRepository;
  idGenerator: IdGenerator;
  clock: Clock;
};

export class CreateWorkOrderUseCase {
  constructor(
    private readonly dependencies: CreateWorkOrderUseCaseDependencies,
  ) {}

  async execute(command: CreateWorkOrderCommand): Promise<WorkOrderResult> {
    const incident = await this.dependencies.incidentQueryRepository.findById(
      command.incidentId,
    );

    if (incident === null) {
      throw new IncidentNotFoundError(command.incidentId);
    }

    const actor = await this.dependencies.actorRepository.findById(
      command.actorId,
    );

    if (actor === null) {
      throw new ActorNotFoundError(command.actorId);
    }

    const existingWorkOrders =
      await this.dependencies.workOrderRepository.findByIncident(
        command.incidentId,
      );
    const hasOpenWorkOrder = existingWorkOrders.some(
      (workOrder) => workOrder.status === 'OPEN',
    );

    if (hasOpenWorkOrder) {
      throw new OpenWorkOrderAlreadyExistsError(command.incidentId);
    }

    const workOrderId = this.dependencies.idGenerator.generate();
    const createdAt = this.dependencies.clock.now();

    const workOrder = WorkOrderAggregate.create({
      workOrderId,
      incidentId: command.incidentId,
      actorId: actor.id,
      description: command.description,
      createdAt,
    });

    const record = toWorkOrderRecord(workOrder);
    await this.dependencies.workOrderRepository.save(record);

    return toWorkOrderResult(record);
  }
}
