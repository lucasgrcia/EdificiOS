import {
  EventEvidenceAssociation,
  EventEvidenceRepository,
} from '../src/operations/application/event-evidence-persistence';
import { PostgresEventEvidenceRepository } from '../src/operations/infrastructure/persistence/postgres-event-evidence-repository';

function createInMemoryPool() {
  const associations = new Map<string, EventEvidenceAssociation>();

  const associationKey = (eventId: string, evidenceId: string): string =>
    `${eventId}:${evidenceId}`;

  return {
    query: jest.fn(async (sql: string, values?: unknown[]) => {
      if (sql.includes('INSERT INTO event_evidences')) {
        const [eventId, evidenceId] = values as [string, string];
        const key = associationKey(eventId, evidenceId);

        if (associations.has(key)) {
          const error = new Error(
            'duplicate key value violates unique constraint "event_evidences_pkey"',
          );
          (error as Error & { code: string }).code = '23505';
          throw error;
        }

        associations.set(key, { eventId, evidenceId });
        return { rowCount: 1, rows: [] };
      }

      if (
        sql.includes('FROM event_evidences') &&
        sql.includes('WHERE event_id = $1')
      ) {
        const [eventId] = values as [string];
        const evidenceIds = [...associations.values()]
          .filter((association) => association.eventId === eventId)
          .map((association) => association.evidenceId)
          .sort();

        return {
          rowCount: evidenceIds.length,
          rows: evidenceIds.map((evidenceId) => ({ evidence_id: evidenceId })),
        };
      }

      if (
        sql.includes('FROM event_evidences') &&
        sql.includes('WHERE evidence_id = $1')
      ) {
        const [evidenceId] = values as [string];
        const eventIds = [...associations.values()]
          .filter((association) => association.evidenceId === evidenceId)
          .map((association) => association.eventId)
          .sort();

        return {
          rowCount: eventIds.length,
          rows: eventIds.map((eventId) => ({ event_id: eventId })),
        };
      }

      throw new Error(`Unexpected query: ${sql}`);
    }),
  };
}

describe('PostgresEventEvidenceRepository integration', () => {
  const eventId = '00000000-0000-0000-0000-000000000010';
  const secondEventId = '00000000-0000-0000-0000-000000000020';
  const firstEvidenceId = '00000000-0000-0000-0000-000000000001';
  const secondEvidenceId = '00000000-0000-0000-0000-000000000002';

  it('allows one event to be backed by several evidences', async () => {
    const pool = createInMemoryPool();
    const repository = new PostgresEventEvidenceRepository(pool as never);

    await repository.associate({ eventId, evidenceId: firstEvidenceId });
    await repository.associate({ eventId, evidenceId: secondEvidenceId });

    await expect(repository.findEvidenceIdsByEventId(eventId)).resolves.toEqual(
      [firstEvidenceId, secondEvidenceId],
    );
  });

  it('allows one evidence to back several events', async () => {
    const pool = createInMemoryPool();
    const repository = new PostgresEventEvidenceRepository(pool as never);

    await repository.associate({ eventId, evidenceId: firstEvidenceId });
    await repository.associate({
      eventId: secondEventId,
      evidenceId: firstEvidenceId,
    });

    await expect(
      repository.findEventIdsByEvidenceId(firstEvidenceId),
    ).resolves.toEqual([eventId, secondEventId]);
  });

  it('persists associations and loads them from both directions', async () => {
    const pool = createInMemoryPool();
    const repository: EventEvidenceRepository =
      new PostgresEventEvidenceRepository(pool as never);

    await repository.associate({ eventId, evidenceId: firstEvidenceId });
    await repository.associate({ eventId, evidenceId: secondEvidenceId });
    await repository.associate({
      eventId: secondEventId,
      evidenceId: firstEvidenceId,
    });

    expect(await repository.findEvidenceIdsByEventId(eventId)).toEqual([
      firstEvidenceId,
      secondEvidenceId,
    ]);
    expect(await repository.findEvidenceIdsByEventId(secondEventId)).toEqual([
      firstEvidenceId,
    ]);
    expect(await repository.findEventIdsByEvidenceId(firstEvidenceId)).toEqual([
      eventId,
      secondEventId,
    ]);
    expect(await repository.findEventIdsByEvidenceId(secondEvidenceId)).toEqual(
      [eventId],
    );
  });

  it('rejects duplicate associations through the primary key', async () => {
    const pool = createInMemoryPool();
    const repository = new PostgresEventEvidenceRepository(pool as never);

    await repository.associate({ eventId, evidenceId: firstEvidenceId });

    await expect(
      repository.associate({ eventId, evidenceId: firstEvidenceId }),
    ).rejects.toMatchObject({ code: '23505' });
  });
});
