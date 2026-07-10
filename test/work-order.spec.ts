import { WorkOrderAggregate } from '../src/operations/domain/work-order/work-order';
import { CreatedAt } from '../src/operations/domain/work-order/value-objects/created-at';
import { IncidentId } from '../src/operations/domain/work-order/value-objects/incident-id';
import { WorkOrderDescription } from '../src/operations/domain/work-order/value-objects/work-order-description';
import { WorkOrderId } from '../src/operations/domain/work-order/value-objects/work-order-id';
import { WorkOrderStatus } from '../src/operations/domain/work-order/value-objects/work-order-status';
import { ActorId } from '../src/operations/domain/actor/value-objects/actor-id';

describe('WorkOrder value objects', () => {
  const workOrderUuid = '00000000-0000-0000-0000-000000000001';
  const incidentUuid = '00000000-0000-0000-0000-000000000010';
  const actorUuid = '00000000-0000-0000-0000-000000000020';

  describe('WorkOrderId', () => {
    it('creates a valid work order id from a UUID', () => {
      expect(
        WorkOrderId.create(` ${workOrderUuid.toUpperCase()} `).toString(),
      ).toBe(workOrderUuid);
    });

    it('rejects an empty work order id', () => {
      expect(() => WorkOrderId.create('   ')).toThrow(
        'Work order id is required.',
      );
    });

    it('rejects an invalid work order id', () => {
      expect(() => WorkOrderId.create('work-order-1')).toThrow(
        'Work order id must be a valid UUID.',
      );
    });
  });

  describe('IncidentId', () => {
    it('creates a valid incident id from a UUID', () => {
      expect(
        IncidentId.create(` ${incidentUuid.toUpperCase()} `).toString(),
      ).toBe(incidentUuid);
    });

    it('rejects an empty incident id', () => {
      expect(() => IncidentId.create('   ')).toThrow('Incident id is required.');
    });

    it('rejects an invalid incident id', () => {
      expect(() => IncidentId.create('incident-1')).toThrow(
        'Incident id must be a valid UUID.',
      );
    });
  });

  describe('WorkOrderDescription', () => {
    it('creates a valid work order description', () => {
      expect(
        WorkOrderDescription.create(' Reparar bomba principal ').toString(),
      ).toBe('Reparar bomba principal');
    });

    it('rejects an empty work order description', () => {
      expect(() => WorkOrderDescription.create('   ')).toThrow(
        'Work order description is required.',
      );
    });
  });

  describe('WorkOrderStatus', () => {
    it.each(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])(
      'accepts supported work order status %s',
      (status) => {
        expect(WorkOrderStatus.create(status).toString()).toBe(status);
      },
    );

    it('normalizes work order status casing', () => {
      expect(WorkOrderStatus.create(' in_progress ').toString()).toBe(
        'IN_PROGRESS',
      );
    });

    it('rejects an empty work order status', () => {
      expect(() => WorkOrderStatus.create('   ')).toThrow(
        'Work order status is not supported.',
      );
    });

    it('rejects unsupported work order status', () => {
      expect(() => WorkOrderStatus.create('PENDING')).toThrow(
        'Work order status is not supported.',
      );
    });
  });

  describe('CreatedAt', () => {
    it('creates a valid created at timestamp', () => {
      const createdAt = new Date('2026-07-10T08:00:00.000Z');

      expect(CreatedAt.create(createdAt).toDate()).toEqual(createdAt);
    });

    it('rejects an invalid created at timestamp', () => {
      expect(() => CreatedAt.create(new Date('invalid'))).toThrow(
        'Created at is required.',
      );
    });
  });

  describe('ActorId reuse', () => {
    it('creates a valid actor id from the shared actor value object', () => {
      expect(ActorId.create(` ${actorUuid} `).toString()).toBe(actorUuid);
    });
  });
});

describe('WorkOrderAggregate', () => {
  const createdAt = new Date('2026-07-10T08:00:00.000Z');
  const validInput = {
    workOrderId: '00000000-0000-0000-0000-000000000001',
    incidentId: '00000000-0000-0000-0000-000000000010',
    actorId: '00000000-0000-0000-0000-000000000020',
    description: 'Reparar bomba principal',
    createdAt,
  };

  it('creates a valid work order in OPEN status', () => {
    const workOrder = WorkOrderAggregate.create(validInput);

    expect(workOrder.id).toBe(validInput.workOrderId);
    expect(workOrder.incidentId).toBe(validInput.incidentId);
    expect(workOrder.actorId).toBe(validInput.actorId);
    expect(workOrder.description).toBe(validInput.description);
    expect(workOrder.createdAt).toEqual(createdAt);
    expect(workOrder.currentStatus).toBe('OPEN');
  });

  it('rehydrates a work order with persisted status', () => {
    const workOrder = WorkOrderAggregate.rehydrate({
      ...validInput,
      status: 'IN_PROGRESS',
    });

    expect(workOrder.currentStatus).toBe('IN_PROGRESS');
    expect(workOrder.incidentId).toBe(validInput.incidentId);
  });

  it('rejects create when work order id is empty', () => {
    expect(() =>
      WorkOrderAggregate.create({
        ...validInput,
        workOrderId: '   ',
      }),
    ).toThrow('Work order id is required.');
  });

  it('rejects rehydrate when work order id is empty', () => {
    expect(() =>
      WorkOrderAggregate.rehydrate({
        ...validInput,
        workOrderId: '   ',
        status: 'OPEN',
      }),
    ).toThrow('Work order id is required.');
  });

  it('starts an open work order and returns a new immutable instance', () => {
    const workOrder = WorkOrderAggregate.create(validInput);

    const started = workOrder.start();

    expect(workOrder.currentStatus).toBe('OPEN');
    expect(started.currentStatus).toBe('IN_PROGRESS');
    expect(started.id).toBe(workOrder.id);
    expect(started.incidentId).toBe(workOrder.incidentId);
    expect(started.actorId).toBe(workOrder.actorId);
    expect(started.description).toBe(workOrder.description);
    expect(started.createdAt).toEqual(workOrder.createdAt);
  });

  it('completes an in progress work order and returns a new immutable instance', () => {
    const started = WorkOrderAggregate.create(validInput).start();

    const completed = started.complete();

    expect(started.currentStatus).toBe('IN_PROGRESS');
    expect(completed.currentStatus).toBe('COMPLETED');
  });

  it('cancels an open work order and returns a new immutable instance', () => {
    const workOrder = WorkOrderAggregate.create(validInput);

    const cancelled = workOrder.cancel();

    expect(workOrder.currentStatus).toBe('OPEN');
    expect(cancelled.currentStatus).toBe('CANCELLED');
  });

  it('cancels an in progress work order', () => {
    const cancelled = WorkOrderAggregate.create(validInput).start().cancel();

    expect(cancelled.currentStatus).toBe('CANCELLED');
  });

  it('rejects start when work order is not open', () => {
    const started = WorkOrderAggregate.create(validInput).start();

    expect(() => started.start()).toThrow(
      'Work order can only be started from OPEN status.',
    );
  });

  it('rejects complete when work order is not in progress', () => {
    const workOrder = WorkOrderAggregate.create(validInput);

    expect(() => workOrder.complete()).toThrow(
      'Work order can only be completed from IN_PROGRESS status.',
    );
  });

  it('rejects cancel when work order is already completed', () => {
    const completed = WorkOrderAggregate.create(validInput).start().complete();

    expect(() => completed.cancel()).toThrow(
      'Completed work order cannot be cancelled.',
    );
  });

  it('rejects cancel when work order is already cancelled', () => {
    const cancelled = WorkOrderAggregate.create(validInput).cancel();

    expect(() => cancelled.cancel()).toThrow('Work order is already cancelled.');
  });

  it('follows the full lifecycle OPEN → IN_PROGRESS → COMPLETED', () => {
    const completed = WorkOrderAggregate.create(validInput)
      .start()
      .complete();

    expect(completed.currentStatus).toBe('COMPLETED');
  });

  it('follows the lifecycle OPEN → CANCELLED without mutating the original', () => {
    const original = WorkOrderAggregate.create(validInput);
    const cancelled = original.cancel();

    expect(original.currentStatus).toBe('OPEN');
    expect(cancelled.currentStatus).toBe('CANCELLED');
  });
});
