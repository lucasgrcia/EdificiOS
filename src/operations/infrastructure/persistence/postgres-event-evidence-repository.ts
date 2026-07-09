import { Pool } from 'pg';

import {
  EventEvidenceAssociation,
  EventEvidenceRepository,
} from '../../application/event-evidence-persistence';

export class PostgresEventEvidenceRepository implements EventEvidenceRepository {
  constructor(private readonly pool: Pool) {}

  async associate(association: EventEvidenceAssociation): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO event_evidences (
          event_id,
          evidence_id
        )
        VALUES ($1, $2)
      `,
      [association.eventId, association.evidenceId],
    );
  }

  async findEvidenceIdsByEventId(eventId: string): Promise<string[]> {
    const result = await this.pool.query(
      `
        SELECT evidence_id
        FROM event_evidences
        WHERE event_id = $1
        ORDER BY evidence_id
      `,
      [eventId],
    );

    return result.rows.map((row) => row.evidence_id);
  }

  async findEventIdsByEvidenceId(evidenceId: string): Promise<string[]> {
    const result = await this.pool.query(
      `
        SELECT event_id
        FROM event_evidences
        WHERE evidence_id = $1
        ORDER BY event_id
      `,
      [evidenceId],
    );

    return result.rows.map((row) => row.event_id);
  }
}
