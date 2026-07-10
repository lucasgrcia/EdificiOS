import { IncidentView } from '../src/operations/application/incident-view';
import { PostgresIncidentQueryRepository } from '../src/operations/infrastructure/persistence/postgres-incident-query-repository';

describe('PostgresIncidentQueryRepository integration', () => {
  const assetId = '00000000-0000-0000-0000-000000000001';
  const otherAssetId = '00000000-0000-0000-0000-000000000002';
  const shiftId = '00000000-0000-0000-0000-000000000030';
  const actorId = '00000000-0000-0000-0000-000000000020';
  const detectedIncident = {
    id: '00000000-0000-0000-0000-000000000101',
    description: 'Carlos detects a leak.',
    current_projection_state: {
      status: 'DETECTED',
      description: 'Carlos detects a leak.',
      detectedAt: '2026-07-07T15:00:00.000Z',
      assetId,
      shiftId,
      actorId,
    },
    created_at: new Date('2026-07-07T15:00:00.000Z'),
  };
  const assignedIncident = {
    id: '00000000-0000-0000-0000-000000000102',
    description: 'Ascensor detenido entre pisos.',
    current_projection_state: {
      status: 'ASSIGNED',
      description: 'Ascensor detenido entre pisos.',
      detectedAt: '2026-07-07T16:00:00.000Z',
      assetId: otherAssetId,
      shiftId,
      actorId,
      assignedAt: '2026-07-07T16:10:00.000Z',
      assignedActorId: '00000000-0000-0000-0000-000000000021',
    },
    created_at: new Date('2026-07-07T16:00:00.000Z'),
  };

  function createInMemoryPool() {
    const incidents = new Map<
      string,
      {
        id: string;
        description: string;
        current_projection_state: Record<string, unknown>;
        created_at: Date;
      }
    >();

    return {
      query: jest.fn(async (sql: string, values?: unknown[]) => {
        if (sql.includes('WHERE id = $1')) {
          const [id] = values as [string];
          const record = incidents.get(id);

          if (record === undefined) {
            return { rowCount: 0, rows: [] };
          }

          return {
            rowCount: 1,
            rows: [record],
          };
        }

        if (sql.includes('FROM incidents')) {
          let rows = [...incidents.values()];

          if (sql.includes("current_projection_state->>'status' = $")) {
            const statusIndex = values?.findIndex(
              (value) => value === 'DETECTED' || value === 'ASSIGNED',
            );

            if (statusIndex !== undefined && statusIndex >= 0) {
              const status = values?.[statusIndex];
              rows = rows.filter(
                (row) => row.current_projection_state.status === status,
              );
            }
          }

          if (sql.includes("current_projection_state->>'assetId' = $")) {
            const assetIdValue = values?.find(
              (value) =>
                value === assetId || value === otherAssetId,
            );
            rows = rows.filter(
              (row) => row.current_projection_state.assetId === assetIdValue,
            );
          }

          if (sql.includes('= ANY(')) {
            const assetIds = values?.find((value) => Array.isArray(value)) as
              | string[]
              | undefined;

            if (assetIds !== undefined) {
              rows = rows.filter((row) =>
                assetIds.includes(
                  row.current_projection_state.assetId as string,
                ),
              );
            }
          }

          if (sql.includes("current_projection_state->>'shiftId' = $")) {
            const shiftIdValue = values?.find((value) => value === shiftId);
            rows = rows.filter(
              (row) => row.current_projection_state.shiftId === shiftIdValue,
            );
          }

          if (sql.includes("current_projection_state->>'actorId' = $")) {
            const actorIdValue = values?.find((value) => value === actorId);
            rows = rows.filter(
              (row) => row.current_projection_state.actorId === actorIdValue,
            );
          }

          rows.sort(
            (left, right) =>
              right.created_at.getTime() - left.created_at.getTime(),
          );

          return {
            rowCount: rows.length,
            rows,
          };
        }

        throw new Error(`Unexpected query: ${sql}`);
      }),
      seed: (record: typeof detectedIncident) => {
        incidents.set(record.id, record);
      },
    };
  }

  const expectedDetectedView: IncidentView = {
    id: detectedIncident.id,
    description: detectedIncident.description,
    status: 'DETECTED',
    detectedAt: '2026-07-07T15:00:00.000Z',
    assetId,
    shiftId,
    actorId,
    assignedAt: null,
    assignedActorId: null,
    startedAt: null,
    resolvedAt: null,
    createdAt: '2026-07-07T15:00:00.000Z',
  };

  it('returns null when incident is not found by id', async () => {
    const pool = {
      query: jest.fn(async () => ({ rowCount: 0, rows: [] })),
    };
    const repository = new PostgresIncidentQueryRepository(pool as never);

    const result = await repository.findById(
      '00000000-0000-0000-0000-000000000099',
    );

    expect(result).toBeNull();
  });

  it('loads an incident view by id from projection state', async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const pool = {
      query: jest.fn(async (sql: string, values?: unknown[]) => {
        queries.push({ sql: sql.trim(), values: values ?? [] });
        return {
          rowCount: 1,
          rows: [detectedIncident],
        };
      }),
    };
    const repository = new PostgresIncidentQueryRepository(pool as never);

    const result = await repository.findById(detectedIncident.id);

    expect(result).toEqual(expectedDetectedView);
    expect(queries).toHaveLength(1);
    expect(queries[0].sql).toContain('FROM incidents');
    expect(queries[0].sql).not.toContain('events');
    expect(queries[0].values).toEqual([detectedIncident.id]);
  });

  it('returns all incidents ordered by created_at desc when no filters are provided', async () => {
    const pool = createInMemoryPool();
    pool.seed(detectedIncident);
    pool.seed(assignedIncident);
    const repository = new PostgresIncidentQueryRepository(pool as never);

    const result = await repository.findAll({});

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(assignedIncident.id);
    expect(result[1].id).toBe(detectedIncident.id);
  });

  it('filters incidents by status from projection state', async () => {
    const pool = createInMemoryPool();
    pool.seed(detectedIncident);
    pool.seed(assignedIncident);
    const repository = new PostgresIncidentQueryRepository(pool as never);

    const result = await repository.findAll({ status: 'DETECTED' });

    expect(result).toEqual([expectedDetectedView]);
  });

  it('filters incidents by assetId from projection state', async () => {
    const pool = createInMemoryPool();
    pool.seed(detectedIncident);
    pool.seed(assignedIncident);
    const repository = new PostgresIncidentQueryRepository(pool as never);

    const result = await repository.findAll({ assetId });

    expect(result).toEqual([expectedDetectedView]);
  });

  it('filters incidents by multiple assetIds from projection state', async () => {
    const pool = createInMemoryPool();
    pool.seed(detectedIncident);
    pool.seed(assignedIncident);
    const repository = new PostgresIncidentQueryRepository(pool as never);

    const result = await repository.findAll({
      assetIds: [assetId, otherAssetId],
    });

    expect(result).toHaveLength(2);
  });

  it('returns an empty list when assetIds filter is empty', async () => {
    const pool = createInMemoryPool();
    pool.seed(detectedIncident);
    const repository = new PostgresIncidentQueryRepository(pool as never);

    const result = await repository.findAll({ assetIds: [] });

    expect(result).toEqual([]);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('filters incidents by shiftId and actorId from projection state', async () => {
    const pool = createInMemoryPool();
    pool.seed(detectedIncident);
    pool.seed(assignedIncident);
    const repository = new PostgresIncidentQueryRepository(pool as never);

    const result = await repository.findAll({ shiftId, actorId });

    expect(result).toHaveLength(2);
  });
});
