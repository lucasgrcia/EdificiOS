import { WorkOrderAggregate } from '../domain/work-order/work-order';
import { WorkOrderStatusLevel } from '../domain/work-order/value-objects/work-order-status';
import { WorkOrderRecord } from './work-order-persistence';
import { WorkOrderResult } from './work-order-result';

export function toWorkOrderRecord(workOrder: WorkOrderAggregate): WorkOrderRecord {
  return {
    id: workOrder.id,
    incidentId: workOrder.incidentId,
    actorId: workOrder.actorId,
    status: workOrder.currentStatus,
    description: workOrder.description,
    createdAt: workOrder.createdAt,
  };
}

export function rehydrateWorkOrder(record: WorkOrderRecord): WorkOrderAggregate {
  return WorkOrderAggregate.rehydrate({
    workOrderId: record.id,
    incidentId: record.incidentId,
    actorId: record.actorId,
    description: record.description,
    createdAt: record.createdAt,
    status: record.status as WorkOrderStatusLevel,
  });
}

export function toWorkOrderResult(record: WorkOrderRecord): WorkOrderResult {
  const workOrder = rehydrateWorkOrder(record);

  return {
    id: workOrder.id,
    incidentId: workOrder.incidentId,
    actorId: workOrder.actorId,
    status: workOrder.currentStatus,
    description: workOrder.description,
    createdAt: workOrder.createdAt,
  };
}
