import { SiteRecord } from '../src/operations/application/site-persistence';
import { PostgresSiteRepository } from '../src/operations/infrastructure/persistence/postgres-site-repository';

describe('PostgresSiteRepository integration', () => {
  const site: SiteRecord = {
    id: '00000000-0000-0000-0000-000000000010',
    name: 'Torre B',
    address: 'Av. Corrientes 1234, CABA',
    timeZone: 'America/Argentina/Buenos_Aires',
    buildingType: 'Residencial',
  };
  const secondSite: SiteRecord = {
    id: '00000000-0000-0000-0000-000000000020',
    name: 'Edificio Central',
    address: 'Av. Santa Fe 5678, CABA',
    timeZone: 'America/Argentina/Buenos_Aires',
    buildingType: 'Comercial',
  };

  function createInMemoryPool() {
    const sites = new Map<string, SiteRecord>();

    return {
      query: jest.fn(async (sql: string, values?: unknown[]) => {
        if (sql.includes('INSERT INTO sites')) {
          const [id, name, address, timeZone, buildingType] = values as [
            string,
            string,
            string,
            string,
            string,
          ];

          sites.set(id, {
            id,
            name,
            address,
            timeZone,
            buildingType,
          });

          return { rowCount: 1, rows: [] };
        }

        if (sql.includes('WHERE id = $1')) {
          const [id] = values as [string];
          const record = sites.get(id);

          if (record === undefined) {
            return { rowCount: 0, rows: [] };
          }

          return {
            rowCount: 1,
            rows: [
              {
                id: record.id,
                name: record.name,
                address: record.address,
                timezone: record.timeZone,
                building_type: record.buildingType,
              },
            ],
          };
        }

        if (sql.includes('FROM sites') && sql.includes('ORDER BY name')) {
          const rows = [...sites.values()]
            .sort((left, right) => left.name.localeCompare(right.name))
            .map((record) => ({
              id: record.id,
              name: record.name,
              address: record.address,
              timezone: record.timeZone,
              building_type: record.buildingType,
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

  it('persists a site', async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const pool = {
      query: jest.fn(async (sql: string, values?: unknown[]) => {
        queries.push({ sql: sql.trim(), values: values ?? [] });
        return { rowCount: 1, rows: [] };
      }),
    };
    const repository = new PostgresSiteRepository(pool as never);

    await repository.save(site);

    expect(queries).toHaveLength(1);
    expect(queries[0].sql).toContain('INSERT INTO sites');
    expect(queries[0].values).toEqual([
      site.id,
      site.name,
      site.address,
      site.timeZone,
      site.buildingType,
    ]);
  });

  it('returns null when site is not found by id', async () => {
    const pool = {
      query: jest.fn(async () => ({ rowCount: 0, rows: [] })),
    };
    const repository = new PostgresSiteRepository(pool as never);

    const result = await repository.findById(
      '00000000-0000-0000-0000-000000000099',
    );

    expect(result).toBeNull();
  });

  it('loads a persisted site by id', async () => {
    const pool = {
      query: jest.fn(async () => ({
        rowCount: 1,
        rows: [
          {
            id: site.id,
            name: site.name,
            address: site.address,
            timezone: site.timeZone,
            building_type: site.buildingType,
          },
        ],
      })),
    };
    const repository = new PostgresSiteRepository(pool as never);

    const result = await repository.findById(site.id);

    expect(result).toEqual(site);
  });

  it('loads all sites ordered by name', async () => {
    const pool = createInMemoryPool();
    const repository = new PostgresSiteRepository(pool as never);

    await repository.save(site);
    await repository.save(secondSite);

    const result = await repository.findAll();

    expect(result).toEqual([secondSite, site]);
  });

  it('returns an empty list when there are no sites', async () => {
    const pool = createInMemoryPool();
    const repository = new PostgresSiteRepository(pool as never);

    const result = await repository.findAll();

    expect(result).toEqual([]);
  });
});
