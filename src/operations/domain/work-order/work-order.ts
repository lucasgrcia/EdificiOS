import { ActorId } from '../actor/value-objects/actor-id';
import { CreatedAt } from './value-objects/created-at';
import { IncidentId } from './value-objects/incident-id';
import {
  WorkOrderStatus,
  WorkOrderStatusLevel,
} from './value-objects/work-order-status';
import { WorkOrderDescription } from './value-objects/work-order-description';
import { WorkOrderId } from './value-objects/work-order-id';

export type CreateWorkOrderInput = {
  workOrderId: string;
  incidentId: string;
  actorId: string;
  description: string;
  createdAt: Date;
};

export type RehydrateWorkOrderInput = {
  workOrderId: string;
  incidentId: string;
  actorId: string;
  description: string;
  createdAt: Date;
  status: WorkOrderStatusLevel;
};

export class WorkOrderAggregate {
  private constructor(
    private readonly workOrderIdentifier: WorkOrderId,
    private readonly workOrderIncidentId: IncidentId,
    private readonly workOrderActorId: ActorId,
    private readonly workOrderDescription: WorkOrderDescription,
    private readonly workOrderCreatedAt: CreatedAt,
    private readonly workOrderStatus: WorkOrderStatus,
  ) {}

  static create(input: CreateWorkOrderInput): WorkOrderAggregate {
    if (input.workOrderId.trim().length === 0) {
      throw new Error('Work order id is required.');
    }

    return new WorkOrderAggregate(
      WorkOrderId.create(input.workOrderId),
      IncidentId.create(input.incidentId),
      ActorId.create(input.actorId),
      WorkOrderDescription.create(input.description),
      CreatedAt.create(input.createdAt),
      WorkOrderStatus.open(),
    );
  }

  static rehydrate(input: RehydrateWorkOrderInput): WorkOrderAggregate {
    if (input.workOrderId.trim().length === 0) {
      throw new Error('Work order id is required.');
    }

    return new WorkOrderAggregate(
      WorkOrderId.create(input.workOrderId),
      IncidentId.create(input.incidentId),
      ActorId.create(input.actorId),
      WorkOrderDescription.create(input.description),
      CreatedAt.create(input.createdAt),
      WorkOrderStatus.create(input.status),
    );
  }

  get id(): string {
    return this.workOrderIdentifier.toString();
  }

  get incidentId(): string {
    return this.workOrderIncidentId.toString();
  }

  get actorId(): string {
    return this.workOrderActorId.toString();
  }

  get description(): string {
    return this.workOrderDescription.toString();
  }

  get createdAt(): Date {
    return this.workOrderCreatedAt.toDate();
  }

  get currentStatus(): WorkOrderStatusLevel {
    return this.workOrderStatus.toString() as WorkOrderStatusLevel;
  }

  start(): WorkOrderAggregate {
    if (!this.workOrderStatus.isOpen()) {
      throw new Error('Work order can only be started from OPEN status.');
    }

    return this.withStatus(WorkOrderStatus.inProgress());
  }

  complete(): WorkOrderAggregate {
    if (!this.workOrderStatus.isInProgress()) {
      throw new Error(
        'Work order can only be completed from IN_PROGRESS status.',
      );
    }

    return this.withStatus(WorkOrderStatus.completed());
  }

  cancel(): WorkOrderAggregate {
    if (this.workOrderStatus.isCompleted()) {
      throw new Error('Completed work order cannot be cancelled.');
    }

    if (this.workOrderStatus.isCancelled()) {
      throw new Error('Work order is already cancelled.');
    }

    return this.withStatus(WorkOrderStatus.cancelled());
  }

  private withStatus(status: WorkOrderStatus): WorkOrderAggregate {
    return new WorkOrderAggregate(
      this.workOrderIdentifier,
      this.workOrderIncidentId,
      this.workOrderActorId,
      this.workOrderDescription,
      this.workOrderCreatedAt,
      status,
    );
  }
}
