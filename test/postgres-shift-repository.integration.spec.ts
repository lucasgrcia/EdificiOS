import { ShiftRecord } from '../src/operations/application/shift-persistence';
import { PostgresShiftRepository } from '../src/operations/infrastructure/persistence/postgres-shift-repository';

describe('PostgresShiftRepository integration', () => {
  const siteId = '00000000-0000-0000-0000-000000000010';
  const otherSiteId = '00000000-0000-0000-0000-000000000020';
  const startedAt = new Date('2026-07-10T08:00:00.000Z');
  const endedAt = new Date('2026-07-10T16:00:00.000Z');
  const openShift: ShiftRecord = {
    id: '00000000-0000-0000-0000-000000000001',
    siteId,
    operatorId: '00000000-0000-0000-0000-000000000030',
    type: 'Mañana',
    status: 'OPEN',
    startedAt,
    endedAt: null,
  };
  const secondOpenShift: ShiftRecord = {
    id: '00000000-0000-0000-0000-000000000002',
    siteId,
    operatorId: '00000000-0000-0000-0000-000000000031',
    type: 'Tarde',
    status: 'OPEN',
    startedAt: new Date('2026-07-10T14:00:00.000Z'),
    endedAt: null,
  };
  const closedShift: ShiftRecord = {
    id: '00000000-0000-0000-0000-000000000003',
    siteId,
    operatorId: '00000000-0000-0000-0000-000000000032',
    type: 'Noche',
    status: 'CLOSED',
    startedAt: new Date('2026-07-09T20:00:00.000Z'),
    endedAt,
  };
  const otherSiteShift: ShiftRecord = {
    id: '00000000-0000-0000-0000-000000000004',
    siteId: otherSiteId,
    operatorId: '00000000-0000-0000-0000-000000000033',
    type: 'Mañana',
    status: 'OPEN',
    startedAt,
    endedAt: null,
  };

  function createInMemoryPool() {
    const shifts = new Map<string, ShiftRecord>();

    return {
      query: jest.fn(async (sql: string, values?: unknown[]) => {
        if (sql.includes('INSERT INTO shifts')) {
          const [
            id,
            recordSiteId,
            operatorId,
            type,
            status,
            recordStartedAt,
            recordEndedAt,
          ] = values as [
            string,
            string,
            string,
            string,
            string,
            Date,
            Date | null,
          ];

          shifts.set(id, {
            id,
            siteId: recordSiteId,
            operatorId,
            type,
            status,
            startedAt: recordStartedAt,
            endedAt: recordEndedAt,
          });

          return { rowCount: 1, rows: [] };
        }

        if (sql.includes('UPDATE shifts')) {
          const [
            id,
            recordSiteId,
            operatorId,
            type,
            status,
            recordStartedAt,
            recordEndedAt,
          ] = values as [
            string,
            string,
            string,
            string,
            string,
            Date,
            Date | null,
          ];

          if (!shifts.has(id)) {
            return { rowCount: 0, rows: [] };
          }

          shifts.set(id, {
            id,
            siteId: recordSiteId,
            operatorId,
            type,
            status,
            startedAt: recordStartedAt,
            endedAt: recordEndedAt,
          });

          return { rowCount: 1, rows: [] };
        }

        if (sql.includes('FROM shifts') && sql.includes('WHERE id = $1')) {
          const [id] = values as [string];
          const record = shifts.get(id);

          if (record === undefined) {
            return { rowCount: 0, rows: [] };
          }

          return {
            rowCount: 1,
            rows: [
              {
                id: record.id,
                site_id: record.siteId,
                operator_id: record.operatorId,
                type: record.type,
                status: record.status,
                started_at: record.startedAt,
                ended_at: record.endedAt,
              },
            ],
          };
        }

        if (sql.includes("status = 'OPEN'")) {
          const [recordSiteId] = values as [string];
          const rows = [...shifts.values()]
            .filter(
              (record) =>
                record.siteId === recordSiteId && record.status === 'OPEN',
            )
            .sort(
              (left, right) =>
                left.startedAt.getTime() - right.startedAt.getTime(),
            )
            .map((record) => ({
              id: record.id,
              site_id: record.siteId,
              operator_id: record.operatorId,
              type: record.type,
              status: record.status,
              started_at: record.startedAt,
              ended_at: record.endedAt,
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

  it('persists a shift', async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const pool = {
      query: jest.fn(async (sql: string, values?: unknown[]) => {
        queries.push({ sql: sql.trim(), values: values ?? [] });
        return { rowCount: 1, rows: [] };
      }),
    };
    const repository = new PostgresShiftRepository(pool as never);

    await repository.save(openShift);

    expect(queries).toHaveLength(1);
    expect(queries[0].sql).toContain('INSERT INTO shifts');
    expect(queries[0].values).toEqual([
      openShift.id,
      openShift.siteId,
      openShift.operatorId,
      openShift.type,
      openShift.status,
      openShift.startedAt,
      openShift.endedAt,
    ]);
  });

  it('returns null when shift is not found by id', async () => {
    const pool = {
      query: jest.fn(async () => ({ rowCount: 0, rows: [] })),
    };
    const repository = new PostgresShiftRepository(pool as never);

    const result = await repository.findById(
      '00000000-0000-0000-0000-000000000099',
    );

    expect(result).toBeNull();
  });

  it('loads a persisted shift by id', async () => {
    const pool = {
      query: jest.fn(async () => ({
        rowCount: 1,
        rows: [
          {
            id: closedShift.id,
            site_id: closedShift.siteId,
            operator_id: closedShift.operatorId,
            type: closedShift.type,
            status: closedShift.status,
            started_at: closedShift.startedAt,
            ended_at: closedShift.endedAt,
          },
        ],
      })),
    };
    const repository = new PostgresShiftRepository(pool as never);

    const result = await repository.findById(closedShift.id);

    expect(result).toEqual(closedShift);
  });

  it('loads active shifts by site ordered by started at', async () => {
    const pool = createInMemoryPool();
    const repository = new PostgresShiftRepository(pool as never);

    await repository.save(secondOpenShift);
    await repository.save(openShift);
    await repository.save(closedShift);
    await repository.save(otherSiteShift);

    const result = await repository.findActiveBySite(siteId);

    expect(result).toEqual([openShift, secondOpenShift]);
  });

  it('returns an empty list when site has no active shifts', async () => {
    const pool = createInMemoryPool();
    const repository = new PostgresShiftRepository(pool as never);

    await repository.save(closedShift);

    const result = await repository.findActiveBySite(siteId);

    expect(result).toEqual([]);
  });

  it('updates an existing shift', async () => {
    const pool = createInMemoryPool();
    const repository = new PostgresShiftRepository(pool as never);

    await repository.save(openShift);
    await repository.update({
      ...openShift,
      status: 'CLOSED',
      endedAt,
    });

    const result = await repository.findById(openShift.id);

    expect(result).toEqual({
      ...openShift,
      status: 'CLOSED',
      endedAt,
    });
  });

  it('fails update when shift row does not exist', async () => {
    const pool = {
      query: jest.fn(async () => ({ rowCount: 0 })),
    };
    const repository = new PostgresShiftRepository(pool as never);

    await expect(
      repository.update({
        ...openShift,
        status: 'CLOSED',
        endedAt,
      }),
    ).rejects.toThrow('Shift was not updated.');
  });
});
