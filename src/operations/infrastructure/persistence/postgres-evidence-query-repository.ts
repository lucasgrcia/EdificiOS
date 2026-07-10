import { Pool } from 'pg';

import { EvidenceQueryRepository } from '../../application/evidence-query-persistence';
import { EvidenceView } from '../../application/evidence-view';
import {
  EvidenceQueryRow,
  toEvidenceView,
} from '../../application/map-evidence-view';

export class PostgresEvidenceQueryRepository implements EvidenceQueryRepository {
  constructor(private readonly pool: Pool) {}

  async findByEventId(eventId: string): Promise<EvidenceView[]> {
    const result = await this.pool.query<EvidenceQueryRow>(
      `
        SELECT
          e.id,
          e.storage_reference,
          e.hash_sha256,
          e.mime_type,
          e.size_bytes,
          e.captured_at
        FROM evidences e
        INNER JOIN event_evidences ee ON ee.evidence_id = e.id
        WHERE ee.event_id = $1
        ORDER BY e.captured_at ASC
      `,
      [eventId],
    );

    return result.rows.map((row) => toEvidenceView(row));
  }
}
