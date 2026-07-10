import { AssetRecord } from '../src/operations/application/asset-persistence';
import { PostgresAssetRepository } from '../src/operations/infrastructure/persistence/postgres-asset-repository';

describe('PostgresAssetRepository integration', () => {
  const siteId = '00000000-0000-0000-0000-000000000010';
  const otherSiteId = '00000000-0000-0000-0000-000000000020';
  const asset: AssetRecord = {
    id: '00000000-0000-0000-0000-000000000001',
    siteId,
    name: 'Bomba principal',
    type: 'Bomba',
    manufacturer: 'Grundfos',
    model: 'CR 32-4',
    serialNumber: 'SN-12345',
    location: 'Subsuelo',
    criticality: 'HIGH',
  };
  const secondAsset: AssetRecord = {
    id: '00000000-0000-0000-0000-000000000002',
    siteId,
    name: 'Ascensor A',
    type: 'Ascensor',
    manufacturer: null,
    model: null,
    serialNumber: null,
    location: 'Torre B',
    criticality: 'CRITICAL',
  };
  const otherSiteAsset: AssetRecord = {
    id: '00000000-0000-0000-0000-000000000003',
    siteId: otherSiteId,
    name: 'Bomba secundaria',
    type: 'Bomba',
    manufacturer: null,
    model: null,
    serialNumber: null,
    location: 'Subsuelo',
    criticality: 'MEDIUM',
  };

  function createInMemoryPool() {
    const assets = new Map<string, AssetRecord>();

    return {
      query: jest.fn(async (sql: string, values?: unknown[]) => {
        if (sql.includes('INSERT INTO assets')) {
          const [
            id,
            recordSiteId,
            name,
            type,
            manufacturer,
            model,
            serialNumber,
            location,
            criticality,
          ] = values as [
            string,
            string,
            string,
            string,
            string | null,
            string | null,
            string | null,
            string,
            string,
          ];

          assets.set(id, {
            id,
            siteId: recordSiteId,
            name,
            type,
            manufacturer,
            model,
            serialNumber,
            location,
            criticality,
          });

          return { rowCount: 1, rows: [] };
        }

        if (sql.includes('WHERE id = $1')) {
          const [id] = values as [string];
          const record = assets.get(id);

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
                type: record.type,
                manufacturer: record.manufacturer,
                model: record.model,
                serial_number: record.serialNumber,
                location: record.location,
                criticality: record.criticality,
              },
            ],
          };
        }

        if (sql.includes('WHERE site_id = $1')) {
          const [recordSiteId] = values as [string];
          const rows = [...assets.values()]
            .filter((record) => record.siteId === recordSiteId)
            .sort((left, right) => left.name.localeCompare(right.name))
            .map((record) => ({
              id: record.id,
              site_id: record.siteId,
              name: record.name,
              type: record.type,
              manufacturer: record.manufacturer,
              model: record.model,
              serial_number: record.serialNumber,
              location: record.location,
              criticality: record.criticality,
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

  it('persists an asset', async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const pool = {
      query: jest.fn(async (sql: string, values?: unknown[]) => {
        queries.push({ sql: sql.trim(), values: values ?? [] });
        return { rowCount: 1, rows: [] };
      }),
    };
    const repository = new PostgresAssetRepository(pool as never);

    await repository.save(asset);

    expect(queries).toHaveLength(1);
    expect(queries[0].sql).toContain('INSERT INTO assets');
    expect(queries[0].values).toEqual([
      asset.id,
      asset.siteId,
      asset.name,
      asset.type,
      asset.manufacturer,
      asset.model,
      asset.serialNumber,
      asset.location,
      asset.criticality,
    ]);
  });

  it('returns null when asset is not found by id', async () => {
    const pool = {
      query: jest.fn(async () => ({ rowCount: 0, rows: [] })),
    };
    const repository = new PostgresAssetRepository(pool as never);

    const result = await repository.findById(
      '00000000-0000-0000-0000-000000000099',
    );

    expect(result).toBeNull();
  });

  it('loads a persisted asset by id', async () => {
    const pool = {
      query: jest.fn(async () => ({
        rowCount: 1,
        rows: [
          {
            id: asset.id,
            site_id: asset.siteId,
            name: asset.name,
            type: asset.type,
            manufacturer: asset.manufacturer,
            model: asset.model,
            serial_number: asset.serialNumber,
            location: asset.location,
            criticality: asset.criticality,
          },
        ],
      })),
    };
    const repository = new PostgresAssetRepository(pool as never);

    const result = await repository.findById(asset.id);

    expect(result).toEqual(asset);
  });

  it('loads assets by site ordered by name', async () => {
    const pool = createInMemoryPool();
    const repository = new PostgresAssetRepository(pool as never);

    await repository.save(secondAsset);
    await repository.save(asset);
    await repository.save(otherSiteAsset);

    const result = await repository.findBySite(siteId);

    expect(result).toEqual([secondAsset, asset]);
  });

  it('returns an empty list when site has no assets', async () => {
    const pool = createInMemoryPool();
    const repository = new PostgresAssetRepository(pool as never);

    await repository.save(otherSiteAsset);

    const result = await repository.findBySite(siteId);

    expect(result).toEqual([]);
  });
});
