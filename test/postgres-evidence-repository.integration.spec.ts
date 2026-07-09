import { PostgresEvidenceRepository } from '../src/operations/infrastructure/persistence/postgres-evidence-repository';
import { EvidenceMetadataRecord } from '../src/operations/application/evidence-persistence';
import { MimeType } from '../src/operations/domain/evidence/value-objects/mime-type';
import { StorageReference } from '../src/operations/domain/evidence/value-objects/storage-reference';

describe('PostgresEvidenceRepository integration', () => {
  const metadata: EvidenceMetadataRecord = {
    id: '00000000-0000-0000-0000-000000000001',
    storageReference: StorageReference.create('2026/07/evidence-1.jpg'),
    hashSha256:
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    mimeType: MimeType.create('image/jpeg'),
    sizeBytes: 2048,
    capturedAt: new Date('2026-07-07T10:00:00.000Z'),
  };

  it('persists evidence metadata', async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const pool = {
      query: jest.fn(async (sql: string, values?: unknown[]) => {
        queries.push({ sql: sql.trim(), values: values ?? [] });
        return { rowCount: 1, rows: [] };
      }),
    };
    const repository = new PostgresEvidenceRepository(pool as never);

    await repository.save(metadata);

    expect(queries).toHaveLength(1);
    expect(queries[0].sql).toContain('INSERT INTO evidences');
    expect(queries[0].values).toEqual([
      metadata.id,
      metadata.storageReference.toString(),
      metadata.hashSha256,
      metadata.mimeType.toString(),
      metadata.sizeBytes,
      metadata.capturedAt,
    ]);
  });

  it('returns null when evidence metadata is not found', async () => {
    const pool = {
      query: jest.fn(async () => ({ rowCount: 0, rows: [] })),
    };
    const repository = new PostgresEvidenceRepository(pool as never);

    const result = await repository.findById(
      '00000000-0000-0000-0000-000000000099',
    );

    expect(result).toBeNull();
  });

  it('loads persisted evidence metadata by id', async () => {
    const pool = {
      query: jest.fn(async () => ({
        rowCount: 1,
        rows: [
          {
            id: metadata.id,
            storage_reference: metadata.storageReference.toString(),
            hash_sha256: metadata.hashSha256,
            mime_type: metadata.mimeType.toString(),
            size_bytes: metadata.sizeBytes.toString(),
            captured_at: metadata.capturedAt,
          },
        ],
      })),
    };
    const repository = new PostgresEvidenceRepository(pool as never);

    const result = await repository.findById(metadata.id);

    expect(result).toEqual(metadata);
  });
});
