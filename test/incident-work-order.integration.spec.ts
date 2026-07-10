import { ActorNotFoundError } from '../src/operations/domain/actor/actor-not-found';
import { IncidentNotFoundError } from '../src/operations/domain/incident/incident-not-found';
import { OpenWorkOrderAlreadyExistsError } from '../src/operations/domain/work-order/open-work-order-already-exists';
import { ActorRecord } from '../src/operations/application/actor-persistence';
import { CreateWorkOrderFromIncidentUseCase } from '../src/operations/application/create-work-order-from-incident-use-case';
import { CreateWorkOrderUseCase } from '../src/operations/application/create-work-order-use-case';
import { IncidentView } from '../src/operations/application/incident-view';
import { WorkOrderRecord } from '../src/operations/application/work-order-persistence';

describe('Incident ↔ WorkOrder integration', () => {
  const incidentId = '00000000-0000-0000-0000-000000000010';
  const detectionActorId = '00000000-0000-0000-0000-000000000020';
  const assignedActorId = '00000000-0000-0000-0000-000000000021';
  const workOrderId = '00000000-0000-0000-0000-000000000001';
  const createdAt = new Date('2026-07-10T08:00:00.000Z');
  const detectedIncident: IncidentView = {
    id: incidentId,
    description: 'Fuga en bomba principal',
    status: 'DETECTED',
    detectedAt: '2026-07-10T07:30:00.000Z',
    assetId: '00000000-0000-0000-0000-000000000030',
    shiftId: '00000000-0000-0000-0000-000000000040',
    actorId: detectionActorId,
    assignedAt: null,
    assignedActorId: null,
    startedAt: null,
    resolvedAt: null,
    createdAt: '2026-07-10T07:30:00.000Z',
  };
  const assignedIncident: IncidentView = {
    ...detectedIncident,
    status: 'ASSIGNED',
    assignedAt: '2026-07-10T08:00:00.000Z',
    assignedActorId,
  };
  const actor: ActorRecord = {
    id: detectionActorId,
    siteId: '00000000-0000-0000-0000-000000000050',
    name: 'Juan Pérez',
    role: 'PORTER',
    status: 'ACTIVE',
  };
  const assignedActor: ActorRecord = {
    id: assignedActorId,
    siteId: '00000000-0000-0000-0000-000000000050',
    name: 'María López',
    role: 'TECHNICIAN',
    status: 'ACTIVE',
  };

  function createRepositories(options?: {
    incident?: IncidentView | null;
    actors?: ActorRecord[];
    existingWorkOrders?: WorkOrderRecord[];
  }) {
    const workOrders = new Map<string, WorkOrderRecord>(
      (options?.existingWorkOrders ?? []).map((record) => [record.id, record]),
    );
    const actors = new Map(
      (options?.actors ?? [actor, assignedActor]).map((record) => [
        record.id,
        record,
      ]),
    );

    const incidentQueryRepository = {
      findById: jest.fn(async (id: string) => {
        if (options?.incident === null) {
          return null;
        }

        const incident = options?.incident ?? detectedIncident;
        return id === incident.id ? structuredClone(incident) : null;
      }),
      findAll: jest.fn(),
    };

    const workOrderRepository = {
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
        workOrders.set(record.id, structuredClone(record));
      }),
      workOrders,
    };

    const actorRepository = {
      save: jest.fn(),
      findById: jest.fn(async (id: string) => {
        const record = actors.get(id);
        return record === undefined ? null : structuredClone(record);
      }),
      findBySite: jest.fn(),
    };

    return {
      incidentQueryRepository,
      workOrderRepository,
      actorRepository,
    };
  }

  function createUseCases(
    repositories: ReturnType<typeof createRepositories>,
    options?: { workOrderId?: string; createdAt?: Date },
  ) {
    const createWorkOrderUseCase = new CreateWorkOrderUseCase({
      workOrderRepository: repositories.workOrderRepository,
      actorRepository: repositories.actorRepository,
      incidentQueryRepository: repositories.incidentQueryRepository,
      idGenerator: {
        generate: () => options?.workOrderId ?? workOrderId,
      },
      clock: {
        now: () => options?.createdAt ?? createdAt,
      },
    });

    const createWorkOrderFromIncidentUseCase =
      new CreateWorkOrderFromIncidentUseCase({
        incidentQueryRepository: repositories.incidentQueryRepository,
        createWorkOrderUseCase,
      });

    return {
      createWorkOrderUseCase,
      createWorkOrderFromIncidentUseCase,
    };
  }

  describe('CreateWorkOrderFromIncidentUseCase', () => {
    it('creates a work order using the detection actor when incident is not assigned', async () => {
      const repositories = createRepositories();
      const { createWorkOrderFromIncidentUseCase } =
        createUseCases(repositories);

      const result = await createWorkOrderFromIncidentUseCase.execute({
        incidentId,
        description: 'Reparar bomba principal',
      });

      expect(result).toEqual({
        id: workOrderId,
        incidentId,
        actorId: detectionActorId,
        status: 'OPEN',
        description: 'Reparar bomba principal',
        createdAt,
      });
      expect(repositories.workOrderRepository.save).toHaveBeenCalledWith({
        id: workOrderId,
        incidentId,
        actorId: detectionActorId,
        status: 'OPEN',
        description: 'Reparar bomba principal',
        createdAt,
      });
    });

    it('creates a work order using the assigned actor when incident is assigned', async () => {
      const repositories = createRepositories({ incident: assignedIncident });
      const { createWorkOrderFromIncidentUseCase } =
        createUseCases(repositories);

      const result = await createWorkOrderFromIncidentUseCase.execute({
        incidentId,
        description: 'Reparar bomba principal',
      });

      expect(result.actorId).toBe(assignedActorId);
      expect(repositories.workOrderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          incidentId,
          actorId: assignedActorId,
        }),
      );
    });

    it('rejects creation when incident does not exist', async () => {
      const repositories = createRepositories({ incident: null });
      const { createWorkOrderFromIncidentUseCase } =
        createUseCases(repositories);

      await expect(
        createWorkOrderFromIncidentUseCase.execute({
          incidentId,
          description: 'Reparar bomba principal',
        }),
      ).rejects.toBeInstanceOf(IncidentNotFoundError);

      expect(repositories.workOrderRepository.save).not.toHaveBeenCalled();
    });

    it('rejects creation when incident already has an open work order', async () => {
      const repositories = createRepositories({
        existingWorkOrders: [
          {
            id: 'existing-work-order',
            incidentId,
            actorId: detectionActorId,
            status: 'OPEN',
            description: 'Orden previa',
            createdAt,
          },
        ],
      });
      const { createWorkOrderFromIncidentUseCase } = createUseCases(
        repositories,
        { workOrderId: '00000000-0000-0000-0000-000000000099' },
      );

      await expect(
        createWorkOrderFromIncidentUseCase.execute({
          incidentId,
          description: 'Reparar bomba principal',
        }),
      ).rejects.toBeInstanceOf(OpenWorkOrderAlreadyExistsError);

      expect(repositories.workOrderRepository.save).not.toHaveBeenCalled();
    });

    it('rejects creation when resolved actor does not exist', async () => {
      const repositories = createRepositories({ actors: [assignedActor] });
      const { createWorkOrderFromIncidentUseCase } =
        createUseCases(repositories);

      await expect(
        createWorkOrderFromIncidentUseCase.execute({
          incidentId,
          description: 'Reparar bomba principal',
        }),
      ).rejects.toBeInstanceOf(ActorNotFoundError);

      expect(repositories.workOrderRepository.save).not.toHaveBeenCalled();
    });

    it('delegates to CreateWorkOrderUseCase without coupling Incident aggregate', async () => {
      const repositories = createRepositories();
      const { createWorkOrderUseCase, createWorkOrderFromIncidentUseCase } =
        createUseCases(repositories);
      const executeSpy = jest.spyOn(createWorkOrderUseCase, 'execute');

      await createWorkOrderFromIncidentUseCase.execute({
        incidentId,
        description: 'Reparar bomba principal',
      });

      expect(executeSpy).toHaveBeenCalledWith({
        incidentId,
        actorId: detectionActorId,
        description: 'Reparar bomba principal',
      });
    });
  });

  describe('Incident → WorkOrder continuity flow', () => {
    it('supports creating a work order after incident detection context exists', async () => {
      const repositories = createRepositories();
      const { createWorkOrderFromIncidentUseCase } =
        createUseCases(repositories);

      const created = await createWorkOrderFromIncidentUseCase.execute({
        incidentId,
        description: 'Reparar bomba principal',
      });
      const listed = await repositories.workOrderRepository.findByIncident(
        incidentId,
      );

      expect(created.status).toBe('OPEN');
      expect(listed).toEqual([
        {
          id: workOrderId,
          incidentId,
          actorId: detectionActorId,
          status: 'OPEN',
          description: 'Reparar bomba principal',
          createdAt,
        },
      ]);
    });

    it('allows a new work order after the previous one is completed', async () => {
      const repositories = createRepositories({
        existingWorkOrders: [
          {
            id: 'completed-work-order',
            incidentId,
            actorId: detectionActorId,
            status: 'COMPLETED',
            description: 'Orden anterior',
            createdAt: new Date('2026-07-09T08:00:00.000Z'),
          },
        ],
      });
      const { createWorkOrderFromIncidentUseCase } = createUseCases(
        repositories,
        { workOrderId: '00000000-0000-0000-0000-000000000002' },
      );

      const result = await createWorkOrderFromIncidentUseCase.execute({
        incidentId,
        description: 'Seguimiento post reparación',
      });

      expect(result.id).toBe('00000000-0000-0000-0000-000000000002');
      expect(result.status).toBe('OPEN');
      expect(repositories.workOrderRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});
