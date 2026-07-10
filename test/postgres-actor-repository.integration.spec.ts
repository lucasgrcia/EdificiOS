import { ActorRecord } from '../src/operations/application/actor-persistence';
import { PostgresActorRepository } from '../src/operations/infrastructure/persistence/postgres-actor-repository';

describe('PostgresActorRepository integration', () => {
  const siteId = '00000000-0000-0000-0000-000000000010';
  const otherSiteId = '00000000-0000-0000-0000-000000000020';
  const actor: ActorRecord = {
    id: '00000000-0000-0000-0000-000000000001',
    siteId,
    name: 'Juan Pérez',
    role: 'PORTER',
    status: 'ACTIVE',
  };
  const secondActor: ActorRecord = {
    id: '00000000-0000-0000-0000-000000000002',
    siteId,
    name: 'María López',
    role: 'ADMINISTRATOR',
    status: 'ACTIVE',
  };
  const otherSiteActor: ActorRecord = {
    id: '00000000-0000-0000-0000-000000000003',
    siteId: otherSiteId,
    name: 'Carlos Ruiz',
    role: 'SECURITY',
    status: 'INACTIVE',
  };

  function createInMemoryPool() {
    const actors = new Map<string, ActorRecord>();

    return {
      query: jest.fn(async (sql: string, values?: unknown[]) => {
        if (sql.includes('INSERT INTO actors')) {
          const [id, recordSiteId, name, role, status] = values as [
            string,
            string,
            string,
            string,
            string,
          ];

          actors.set(id, {
            id,
            siteId: recordSiteId,
            name,
            role,
            status,
          });

          return { rowCount: 1, rows: [] };
        }

        if (sql.includes('WHERE id = $1')) {
          const [id] = values as [string];
          const record = actors.get(id);

          if (record === undefined) {
            return { rowCount: 0, rows: [] };
          }

          return {
            rowCount: 1,
            rows: [
              {
                id: record.id,
                site_id: record.siteId,
                name: record.name,
                role: record.role,
                status: record.status,
              },
            ],
          };
        }

        if (sql.includes('WHERE site_id = $1')) {
          const [recordSiteId] = values as [string];
          const rows = [...actors.values()]
            .filter((record) => record.siteId === recordSiteId)
            .sort((left, right) => left.name.localeCompare(right.name))
            .map((record) => ({
              id: record.id,
              site_id: record.siteId,
              name: record.name,
              role: record.role,
              status: record.status,
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

  it('persists an actor', async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const pool = {
      query: jest.fn(async (sql: string, values?: unknown[]) => {
        queries.push({ sql: sql.trim(), values: values ?? [] });
        return { rowCount: 1, rows: [] };
      }),
    };
    const repository = new PostgresActorRepository(pool as never);

    await repository.save(actor);

    expect(queries).toHaveLength(1);
    expect(queries[0].sql).toContain('INSERT INTO actors');
    expect(queries[0].values).toEqual([
      actor.id,
      actor.siteId,
      actor.name,
      actor.role,
      actor.status,
    ]);
  });

  it('returns null when actor is not found by id', async () => {
    const pool = {
      query: jest.fn(async () => ({ rowCount: 0, rows: [] })),
    };
    const repository = new PostgresActorRepository(pool as never);

    const result = await repository.findById(
      '00000000-0000-0000-0000-000000000099',
    );

    expect(result).toBeNull();
  });

  it('loads a persisted actor by id', async () => {
    const pool = {
      query: jest.fn(async () => ({
        rowCount: 1,
        rows: [
          {
            id: actor.id,
            site_id: actor.siteId,
            name: actor.name,
            role: actor.role,
            status: actor.status,
          },
        ],
      })),
    };
    const repository = new PostgresActorRepository(pool as never);

    const result = await repository.findById(actor.id);

    expect(result).toEqual(actor);
  });

  it('loads actors by site ordered by name', async () => {
    const pool = createInMemoryPool();
    const repository = new PostgresActorRepository(pool as never);

    await repository.save(secondActor);
    await repository.save(actor);
    await repository.save(otherSiteActor);

    const result = await repository.findBySite(siteId);

    expect(result).toEqual([actor, secondActor]);
  });

  it('returns an empty list when site has no actors', async () => {
    const pool = createInMemoryPool();
    const repository = new PostgresActorRepository(pool as never);

    await repository.save(otherSiteActor);

    const result = await repository.findBySite(siteId);

    expect(result).toEqual([]);
  });
});
