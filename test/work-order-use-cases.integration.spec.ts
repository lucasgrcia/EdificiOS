import { ActorNotFoundError } from '../src/operations/domain/actor/actor-not-found';
import { IncidentNotFoundError } from '../src/operations/domain/incident/incident-not-found';
import { OpenWorkOrderAlreadyExistsError } from '../src/operations/domain/work-order/open-work-order-already-exists';
import { WorkOrderNotFoundError } from '../src/operations/domain/work-order/work-order-not-found';
import { ActorRecord } from '../src/operations/application/actor-persistence';
import { CancelWorkOrderUseCase } from '../src/operations/application/cancel-work-order-use-case';
import { CompleteWorkOrderUseCase } from '../src/operations/application/complete-work-order-use-case';
import { CreateWorkOrderUseCase } from '../src/operations/application/create-work-order-use-case';
import { IncidentView } from '../src/operations/application/incident-view';
import { StartWorkOrderUseCase } from '../src/operations/application/start-work-order-use-case';
import { WorkOrderRecord } from '../src/operations/application/work-order-persistence';

describe('Work order use cases integration', () => {
  const incidentId = '00000000-0000-0000-0000-000000000010';
  const actorId = '00000000-0000-0000-0000-000000000020';
  const workOrderId = '00000000-0000-0000-0000-000000000001';
  const createdAt = new Date('2026-07-10T08:00:00.000Z');
  const incident: IncidentView = {
    id: incidentId,
    description: 'Fuga en bomba principal',
    status: 'DETECTED',
    detectedAt: '2026-07-10T07:30:00.000Z',
    assetId: '00000000-0000-0000-0000-000000000030',
    shiftId: '00000000-0000-0000-0000-000000000040',
    actorId,
    assignedAt: null,
    assignedActorId: null,
    startedAt: null,
    resolvedAt: null,
    createdAt: '2026-07-10T07:30:00.000Z',
  };
  const actor: ActorRecord = {
    id: actorId,
    siteId: '00000000-0000-0000-0000-000000000050',
    name: 'Juan Pérez',
    role: 'PORTER',
    status: 'ACTIVE',
  };
  const createCommand = {
    incidentId,
    actorId,
    description: 'Reparar bomba principal',
  };
  const openWorkOrder: WorkOrderRecord = {
    id: workOrderId,
    incidentId,
    actorId,
    status: 'OPEN',
    description: 'Reparar bomba principal',
    createdAt,
  };

  function createWorkOrderRepository() {
    const workOrders = new Map<string, WorkOrderRecord>();

    return {
      save: jest.fn(async (record: WorkOrderRecord) => {
        workOrders.set(record.id, structuredClone(record));
      }),
      findById: jest.fn(async (id: string) => {
        const record = workOrders.get(id);
        return record === undefined ? null : structuredClone(record);
      }),
      findByIncident: jest.fn(async (recordIncidentId: string) => {
        return [...workOrders.values()]
          .filter((record) => record.incidentId === recordIncidentId)
          .sort(
            (left, right) =>
              left.createdAt.getTime() - right.createdAt.getTime(),
          )
          .map((record) => structuredClone(record));
      }),
      update: jest.fn(async (record: WorkOrderRecord) => {
        if (!workOrders.has(record.id)) {
          throw new Error('Work order was not updated.');
        }

        workOrders.set(record.id, structuredClone(record));
      }),
      workOrders,
    };
  }

  function createActorRepository(options?: { actorExists?: boolean }) {
    return {
      save: jest.fn(),
      findById: jest.fn(async (id: string) => {
        if (options?.actorExists === false) {
          return null;
        }

        return id === actorId ? structuredClone(actor) : null;
      }),
      findBySite: jest.fn(),
    };
  }

  function createIncidentQueryRepository(options?: {
    incidentExists?: boolean;
  }) {
    return {
      findById: jest.fn(async (id: string) => {
        if (options?.incidentExists === false) {
          return null;
        }

        return id === incidentId ? structuredClone(incident) : null;
      }),
      findAll: jest.fn(),
    };
  }

  function createCreateDependencies(
    workOrderRepository: ReturnType<typeof createWorkOrderRepository>,
    options?: {
      incidentExists?: boolean;
      actorExists?: boolean;
      workOrderId?: string;
      createdAt?: Date;
    },
  ) {
    return {
      workOrderRepository,
      actorRepository: createActorRepository({
        actorExists: options?.actorExists,
      }),
      incidentQueryRepository: createIncidentQueryRepository({
        incidentExists: options?.incidentExists,
      }),
      idGenerator: {
        generate: () => options?.workOrderId ?? workOrderId,
      },
      clock: {
        now: () => options?.createdAt ?? createdAt,
      },
    };
  }

  describe('CreateWorkOrderUseCase', () => {
    it('creates a work order when incident and actor exist', async () => {
      const workOrderRepository = createWorkOrderRepository();
      const useCase = new CreateWorkOrderUseCase(
        createCreateDependencies(workOrderRepository),
      );

      const result = await useCase.execute(createCommand);

      expect(result).toEqual({
        id: workOrderId,
        incidentId,
        actorId,
        status: 'OPEN',
        description: 'Reparar bomba principal',
        createdAt,
      });
      expect(workOrderRepository.save).toHaveBeenCalledTimes(1);
      expect(workOrderRepository.save).toHaveBeenCalledWith(openWorkOrder);
    });

    it('rejects creation when the incident does not exist', async () => {
      const workOrderRepository = createWorkOrderRepository();
      const useCase = new CreateWorkOrderUseCase(
        createCreateDependencies(workOrderRepository, {
          incidentExists: false,
        }),
      );

      await expect(useCase.execute(createCommand)).rejects.toBeInstanceOf(
        IncidentNotFoundError,
      );

      expect(workOrderRepository.save).not.toHaveBeenCalled();
    });

    it('rejects creation when the actor does not exist', async () => {
      const workOrderRepository = createWorkOrderRepository();
      const useCase = new CreateWorkOrderUseCase(
        createCreateDependencies(workOrderRepository, { actorExists: false }),
      );

      await expect(useCase.execute(createCommand)).rejects.toBeInstanceOf(
        ActorNotFoundError,
      );

      expect(workOrderRepository.save).not.toHaveBeenCalled();
    });

    it('rejects creation when the incident already has an open work order', async () => {
      const workOrderRepository = createWorkOrderRepository();
      workOrderRepository.workOrders.set(workOrderId, openWorkOrder);
      const useCase = new CreateWorkOrderUseCase(
        createCreateDependencies(workOrderRepository, {
          workOrderId: '00000000-0000-0000-0000-000000000099',
        }),
      );

      await expect(useCase.execute(createCommand)).rejects.toBeInstanceOf(
        OpenWorkOrderAlreadyExistsError,
      );

      expect(workOrderRepository.save).not.toHaveBeenCalled();
    });

    it('allows creation when the incident only has completed work orders', async () => {
      const workOrderRepository = createWorkOrderRepository();
      workOrderRepository.workOrders.set('existing-work-order', {
        ...openWorkOrder,
        id: 'existing-work-order',
        status: 'COMPLETED',
      });
      const useCase = new CreateWorkOrderUseCase(
        createCreateDependencies(workOrderRepository),
      );

      const result = await useCase.execute(createCommand);

      expect(result.status).toBe('OPEN');
      expect(workOrderRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('StartWorkOrderUseCase', () => {
    it('starts an open work order', async () => {
      const workOrderRepository = createWorkOrderRepository();
      workOrderRepository.workOrders.set(workOrderId, openWorkOrder);
      const useCase = new StartWorkOrderUseCase({ workOrderRepository });

      const result = await useCase.execute({ workOrderId });

      expect(result).toEqual({
        ...openWorkOrder,
        status: 'IN_PROGRESS',
      });
      expect(workOrderRepository.update).toHaveBeenCalledTimes(1);
      expect(workOrderRepository.update).toHaveBeenCalledWith({
        ...openWorkOrder,
        status: 'IN_PROGRESS',
      });
    });

    it('rejects starting a work order that does not exist', async () => {
      const workOrderRepository = createWorkOrderRepository();
      const useCase = new StartWorkOrderUseCase({ workOrderRepository });

      await expect(
        useCase.execute({ workOrderId: 'missing-work-order' }),
      ).rejects.toBeInstanceOf(WorkOrderNotFoundError);

      expect(workOrderRepository.update).not.toHaveBeenCalled();
    });

    it('rejects starting a work order that is not open', async () => {
      const workOrderRepository = createWorkOrderRepository();
      workOrderRepository.workOrders.set(workOrderId, {
        ...openWorkOrder,
        status: 'IN_PROGRESS',
      });
      const useCase = new StartWorkOrderUseCase({ workOrderRepository });

      await expect(useCase.execute({ workOrderId })).rejects.toThrow(
        'Work order can only be started from OPEN status.',
      );

      expect(workOrderRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('CompleteWorkOrderUseCase', () => {
    it('completes an in progress work order', async () => {
      const workOrderRepository = createWorkOrderRepository();
      workOrderRepository.workOrders.set(workOrderId, {
        ...openWorkOrder,
        status: 'IN_PROGRESS',
      });
      const useCase = new CompleteWorkOrderUseCase({ workOrderRepository });

      const result = await useCase.execute({ workOrderId });

      expect(result).toEqual({
        ...openWorkOrder,
        status: 'COMPLETED',
      });
      expect(workOrderRepository.update).toHaveBeenCalledTimes(1);
      expect(workOrderRepository.update).toHaveBeenCalledWith({
        ...openWorkOrder,
        status: 'COMPLETED',
      });
    });

    it('rejects completing a work order that does not exist', async () => {
      const workOrderRepository = createWorkOrderRepository();
      const useCase = new CompleteWorkOrderUseCase({ workOrderRepository });

      await expect(
        useCase.execute({ workOrderId: 'missing-work-order' }),
      ).rejects.toBeInstanceOf(WorkOrderNotFoundError);

      expect(workOrderRepository.update).not.toHaveBeenCalled();
    });

    it('rejects completing a work order that is not in progress', async () => {
      const workOrderRepository = createWorkOrderRepository();
      workOrderRepository.workOrders.set(workOrderId, openWorkOrder);
      const useCase = new CompleteWorkOrderUseCase({ workOrderRepository });

      await expect(useCase.execute({ workOrderId })).rejects.toThrow(
        'Work order can only be completed from IN_PROGRESS status.',
      );

      expect(workOrderRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('CancelWorkOrderUseCase', () => {
    it('cancels an open work order', async () => {
      const workOrderRepository = createWorkOrderRepository();
      workOrderRepository.workOrders.set(workOrderId, openWorkOrder);
      const useCase = new CancelWorkOrderUseCase({ workOrderRepository });

      const result = await useCase.execute({ workOrderId });

      expect(result).toEqual({
        ...openWorkOrder,
        status: 'CANCELLED',
      });
      expect(workOrderRepository.update).toHaveBeenCalledTimes(1);
      expect(workOrderRepository.update).toHaveBeenCalledWith({
        ...openWorkOrder,
        status: 'CANCELLED',
      });
    });

    it('cancels an in progress work order', async () => {
      const workOrderRepository = createWorkOrderRepository();
      workOrderRepository.workOrders.set(workOrderId, {
        ...openWorkOrder,
        status: 'IN_PROGRESS',
      });
      const useCase = new CancelWorkOrderUseCase({ workOrderRepository });

      const result = await useCase.execute({ workOrderId });

      expect(result.status).toBe('CANCELLED');
      expect(workOrderRepository.update).toHaveBeenCalledTimes(1);
    });

    it('rejects cancelling a work order that does not exist', async () => {
      const workOrderRepository = createWorkOrderRepository();
      const useCase = new CancelWorkOrderUseCase({ workOrderRepository });

      await expect(
        useCase.execute({ workOrderId: 'missing-work-order' }),
      ).rejects.toBeInstanceOf(WorkOrderNotFoundError);

      expect(workOrderRepository.update).not.toHaveBeenCalled();
    });

    it('rejects cancelling a completed work order', async () => {
      const workOrderRepository = createWorkOrderRepository();
      workOrderRepository.workOrders.set(workOrderId, {
        ...openWorkOrder,
        status: 'COMPLETED',
      });
      const useCase = new CancelWorkOrderUseCase({ workOrderRepository });

      await expect(useCase.execute({ workOrderId })).rejects.toThrow(
        'Completed work order cannot be cancelled.',
      );

      expect(workOrderRepository.update).not.toHaveBeenCalled();
    });

    it('rejects cancelling a work order that is already cancelled', async () => {
      const workOrderRepository = createWorkOrderRepository();
      workOrderRepository.workOrders.set(workOrderId, {
        ...openWorkOrder,
        status: 'CANCELLED',
      });
      const useCase = new CancelWorkOrderUseCase({ workOrderRepository });

      await expect(useCase.execute({ workOrderId })).rejects.toThrow(
        'Work order is already cancelled.',
      );

      expect(workOrderRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('Work order continuity flow', () => {
    it('supports create, start, complete in sequence', async () => {
      const workOrderRepository = createWorkOrderRepository();
      const createUseCase = new CreateWorkOrderUseCase(
        createCreateDependencies(workOrderRepository),
      );
      const startUseCase = new StartWorkOrderUseCase({ workOrderRepository });
      const completeUseCase = new CompleteWorkOrderUseCase({
        workOrderRepository,
      });

      const created = await createUseCase.execute(createCommand);
      const started = await startUseCase.execute({ workOrderId: created.id });
      const completed = await completeUseCase.execute({
        workOrderId: created.id,
      });

      expect(created.status).toBe('OPEN');
      expect(started.status).toBe('IN_PROGRESS');
      expect(completed.status).toBe('COMPLETED');
    });

    it('supports create and cancel without mutating prior records', async () => {
      const workOrderRepository = createWorkOrderRepository();
      const createUseCase = new CreateWorkOrderUseCase(
        createCreateDependencies(workOrderRepository),
      );
      const cancelUseCase = new CancelWorkOrderUseCase({ workOrderRepository });

      const created = await createUseCase.execute(createCommand);
      const cancelled = await cancelUseCase.execute({
        workOrderId: created.id,
      });

      expect(created.status).toBe('OPEN');
      expect(cancelled.status).toBe('CANCELLED');
    });
  });
});
