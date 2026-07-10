import { WorkOrderRecord } from '../src/operations/application/work-order-persistence';
import { PostgresWorkOrderRepository } from '../src/operations/infrastructure/persistence/postgres-work-order-repository';

describe('PostgresWorkOrderRepository integration', () => {
  const incidentId = '00000000-0000-0000-0000-000000000010';
  const otherIncidentId = '00000000-0000-0000-0000-000000000020';
  const createdAt = new Date('2026-07-10T08:00:00.000Z');
  const laterCreatedAt = new Date('2026-07-10T10:00:00.000Z');
  const workOrder: WorkOrderRecord = {
    id: '00000000-0000-0000-0000-000000000001',
    incidentId,
    actorId: '00000000-0000-0000-0000-000000000030',
    status: 'OPEN',
    description: 'Reparar bomba principal',
    createdAt,
  };
  const secondWorkOrder: WorkOrderRecord = {
    id: '00000000-0000-0000-0000-000000000002',
    incidentId,
    actorId: '00000000-0000-0000-0000-000000000031',
    status: 'IN_PROGRESS',
    description: 'Revisar válvula de retorno',
    createdAt: laterCreatedAt,
  };
  const otherIncidentWorkOrder: WorkOrderRecord = {
    id: '00000000-0000-0000-0000-000000000003',
    incidentId: otherIncidentId,
    actorId: '00000000-0000-0000-0000-000000000032',
    status: 'OPEN',
    description: 'Inspeccionar ascensor',
    createdAt,
  };

  function createInMemoryPool() {
    const workOrders = new Map<string, WorkOrderRecord>();

    return {
      query: jest.fn(async (sql: string, values?: unknown[]) => {
        if (sql.includes('INSERT INTO work_orders')) {
          const [
            id,
            recordIncidentId,
            actorId,
            status,
            description,
            recordCreatedAt,
          ] = values as [string, string, string, string, string, Date];

          workOrders.set(id, {
            id,
            incidentId: recordIncidentId,
            actorId,
            status,
            description,
            createdAt: recordCreatedAt,
          });

          return { rowCount: 1, rows: [] };
        }

        if (sql.includes('UPDATE work_orders')) {
          const [
            id,
            recordIncidentId,
            actorId,
            status,
            description,
            recordCreatedAt,
          ] = values as [string, string, string, string, string, Date];

          if (!workOrders.has(id)) {
            return { rowCount: 0, rows: [] };
          }

          workOrders.set(id, {
            id,
            incidentId: recordIncidentId,
            actorId,
            status,
            description,
            createdAt: recordCreatedAt,
          });

          return { rowCount: 1, rows: [] };
        }

        if (sql.includes('FROM work_orders') && sql.includes('WHERE id = $1')) {
          const [id] = values as [string];
          const record = workOrders.get(id);

          if (record === undefined) {
            return { rowCount: 0, rows: [] };
          }

          return {
            rowCount: 1,
            rows: [
              {
                id: record.id,
                incident_id: record.incidentId,
                actor_id: record.actorId,
                status: record.status,
                description: record.description,
                created_at: record.createdAt,
              },
            ],
          };
        }

        if (sql.includes('WHERE incident_id = $1')) {
          const [recordIncidentId] = values as [string];
          const rows = [...workOrders.values()]
            .filter((record) => record.incidentId === recordIncidentId)
            .sort(
              (left, right) =>
                left.createdAt.getTime() - right.createdAt.getTime(),
            )
            .map((record) => ({
              id: record.id,
              incident_id: record.incidentId,
              actor_id: record.actorId,
              status: record.status,
              description: record.description,
              created_at: record.createdAt,
            }));

          return {
            rowCount: rows.length,
            rows,
          };
        }

        throw new Error(`Unexpected query: ${sql}`);
      }),
    };
  }

  it('persists a work order', async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const pool = {
      query: jest.fn(async (sql: string, values?: unknown[]) => {
        queries.push({ sql: sql.trim(), values: values ?? [] });
        return { rowCount: 1, rows: [] };
      }),
    };
    const repository = new PostgresWorkOrderRepository(pool as never);

    await repository.save(workOrder);

    expect(queries).toHaveLength(1);
    expect(queries[0].sql).toContain('INSERT INTO work_orders');
    expect(queries[0].values).toEqual([
      workOrder.id,
      workOrder.incidentId,
      workOrder.actorId,
      workOrder.status,
      workOrder.description,
      workOrder.createdAt,
    ]);
  });

  it('returns null when work order is not found by id', async () => {
    const pool = {
      query: jest.fn(async () => ({ rowCount: 0, rows: [] })),
    };
    const repository = new PostgresWorkOrderRepository(pool as never);

    const result = await repository.findById(
      '00000000-0000-0000-0000-000000000099',
    );

    expect(result).toBeNull();
  });

  it('loads a persisted work order by id', async () => {
    const pool = {
      query: jest.fn(async () => ({
        rowCount: 1,
        rows: [
          {
            id: workOrder.id,
            incident_id: workOrder.incidentId,
            actor_id: workOrder.actorId,
            status: workOrder.status,
            description: workOrder.description,
            created_at: workOrder.createdAt,
          },
        ],
      })),
    };
    const repository = new PostgresWorkOrderRepository(pool as never);

    const result = await repository.findById(workOrder.id);

    expect(result).toEqual(workOrder);
  });

  it('loads work orders by incident ordered by created at', async () => {
    const pool = createInMemoryPool();
    const repository = new PostgresWorkOrderRepository(pool as never);

    await repository.save(secondWorkOrder);
    await repository.save(workOrder);
    await repository.save(otherIncidentWorkOrder);

    const result = await repository.findByIncident(incidentId);

    expect(result).toEqual([workOrder, secondWorkOrder]);
  });

  it('returns an empty list when incident has no work orders', async () => {
    const pool = createInMemoryPool();
    const repository = new PostgresWorkOrderRepository(pool as never);

    await repository.save(otherIncidentWorkOrder);

    const result = await repository.findByIncident(incidentId);

    expect(result).toEqual([]);
  });

  it('updates an existing work order', async () => {
    const pool = createInMemoryPool();
    const repository = new PostgresWorkOrderRepository(pool as never);

    await repository.save(workOrder);
    await repository.update({
      ...workOrder,
      status: 'IN_PROGRESS',
    });

    const result = await repository.findById(workOrder.id);

    expect(result).toEqual({
      ...workOrder,
      status: 'IN_PROGRESS',
    });
  });

  it('fails update when work order row does not exist', async () => {
    const pool = {
      query: jest.fn(async () => ({ rowCount: 0 })),
    };
    const repository = new PostgresWorkOrderRepository(pool as never);

    await expect(
      repository.update({
        ...workOrder,
        status: 'IN_PROGRESS',
      }),
    ).rejects.toThrow('Work order was not updated.');
  });
});
