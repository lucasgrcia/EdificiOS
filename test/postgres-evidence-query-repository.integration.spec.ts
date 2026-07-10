import { EvidenceView } from '../src/operations/application/evidence-view';
import { PostgresEvidenceQueryRepository } from '../src/operations/infrastructure/persistence/postgres-evidence-query-repository';

describe('PostgresEvidenceQueryRepository integration', () => {
  const eventId = '00000000-0000-0000-0000-000000000010';
  const otherEventId = '00000000-0000-0000-0000-000000000020';
  const firstEvidenceId = '00000000-0000-0000-0000-000000000001';
  const secondEvidenceId = '00000000-0000-0000-0000-000000000002';
  const firstEvidence = {
    id: firstEvidenceId,
    storage_reference: '2026/07/event-1/bomba.jpg',
    hash_sha256: 'a'.repeat(64),
    mime_type: 'image/jpeg',
    size_bytes: 1024,
    captured_at: new Date('2026-07-07T15:00:00.000Z'),
  };
  const secondEvidence = {
    id: secondEvidenceId,
    storage_reference: '2026/07/event-1/ascensor.jpg',
    hash_sha256: 'b'.repeat(64),
    mime_type: 'image/png',
    size_bytes: 2048,
    captured_at: new Date('2026-07-07T15:05:00.000Z'),
  };
  const expectedFirstView: EvidenceView = {
    id: firstEvidenceId,
    storageReference: firstEvidence.storage_reference,
    hashSha256: firstEvidence.hash_sha256,
    mimeType: firstEvidence.mime_type,
    sizeBytes: 1024,
    capturedAt: '2026-07-07T15:00:00.000Z',
  };
  const expectedSecondView: EvidenceView = {
    id: secondEvidenceId,
    storageReference: secondEvidence.storage_reference,
    hashSha256: secondEvidence.hash_sha256,
    mimeType: secondEvidence.mime_type,
    sizeBytes: 2048,
    capturedAt: '2026-07-07T15:05:00.000Z',
  };

  function createInMemoryPool() {
    const associations = new Map<string, Set<string>>();
    const evidences = new Map<string, typeof firstEvidence>();

    return {
      query: jest.fn(async (sql: string, values?: unknown[]) => {
        if (!sql.includes('FROM evidences e')) {
          throw new Error(`Unexpected query: ${sql}`);
        }

        const [queryEventId] = values as [string];
        const evidenceIds = associations.get(queryEventId);

        if (evidenceIds === undefined) {
          return { rowCount: 0, rows: [] };
        }

        const rows = [...evidenceIds]
          .map((evidenceId) => evidences.get(evidenceId))
          .filter((evidence) => evidence !== undefined)
          .sort(
            (left, right) =>
              left.captured_at.getTime() - right.captured_at.getTime(),
          );

        return {
          rowCount: rows.length,
          rows,
        };
      }),
      seedAssociation: (recordEventId: string, evidenceId: string) => {
        const existing = associations.get(recordEventId) ?? new Set<string>();
        existing.add(evidenceId);
        associations.set(recordEventId, existing);
      },
      seedEvidence: (evidence: typeof firstEvidence) => {
        evidences.set(evidence.id, evidence);
      },
    };
  }

  it('returns evidence metadata associated with the event', async () => {
    const pool = createInMemoryPool();
    pool.seedEvidence(firstEvidence);
    pool.seedEvidence(secondEvidence);
    pool.seedAssociation(eventId, firstEvidenceId);
    pool.seedAssociation(eventId, secondEvidenceId);
    const repository = new PostgresEvidenceQueryRepository(pool as never);

    const result = await repository.findByEventId(eventId);

    expect(result).toEqual([expectedFirstView, expectedSecondView]);
  });

  it('returns an empty list when event has no associated evidence', async () => {
    const pool = createInMemoryPool();
    const repository = new PostgresEvidenceQueryRepository(pool as never);

    const result = await repository.findByEventId(eventId);

    expect(result).toEqual([]);
  });

  it('does not return evidence linked to other events', async () => {
    const pool = createInMemoryPool();
    pool.seedEvidence(firstEvidence);
    pool.seedAssociation(otherEventId, firstEvidenceId);
    const repository = new PostgresEvidenceQueryRepository(pool as never);

    const result = await repository.findByEventId(eventId);

    expect(result).toEqual([]);
  });

  it('reads metadata only from evidences joined with event_evidences', async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const pool = {
      query: jest.fn(async (sql: string, values?: unknown[]) => {
        queries.push({ sql: sql.trim(), values: values ?? [] });
        return { rowCount: 1, rows: [firstEvidence] };
      }),
    };
    const repository = new PostgresEvidenceQueryRepository(pool as never);

    await repository.findByEventId(eventId);

    expect(queries).toHaveLength(1);
    expect(queries[0].sql).toContain('FROM evidences e');
    expect(queries[0].sql).toContain('INNER JOIN event_evidences ee');
    expect(queries[0].sql).not.toContain('events');
    expect(queries[0].values).toEqual([eventId]);
  });
});
