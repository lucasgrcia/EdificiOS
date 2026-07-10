import { Pool } from 'pg';

import {
  ShiftRecord,
  ShiftRepository,
} from '../../application/shift-persistence';

export class PostgresShiftRepository implements ShiftRepository {
  constructor(private readonly pool: Pool) {}

  async save(shift: ShiftRecord): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO shifts (
          id,
          site_id,
          operator_id,
          type,
          status,
          started_at,
          ended_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        shift.id,
        shift.siteId,
        shift.actorId,
        shift.type,
        shift.status,
        shift.startedAt,
        shift.endedAt,
      ],
    );
  }

  async findById(id: string): Promise<ShiftRecord | null> {
    const result = await this.pool.query(
      `
        SELECT
          id,
          site_id,
          operator_id,
          type,
          status,
          started_at,
          ended_at
        FROM shifts
        WHERE id = $1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.toShiftRecord(result.rows[0]);
  }

  async findActiveBySite(siteId: string): Promise<ShiftRecord[]> {
    const result = await this.pool.query(
      `
        SELECT
          id,
          site_id,
          operator_id,
          type,
          status,
          started_at,
          ended_at
        FROM shifts
        WHERE site_id = $1
          AND status = 'OPEN'
        ORDER BY started_at
      `,
      [siteId],
    );

    return result.rows.map((row) => this.toShiftRecord(row));
  }

  async update(shift: ShiftRecord): Promise<void> {
    const result = await this.pool.query(
      `
        UPDATE shifts
        SET
          site_id = $2,
          operator_id = $3,
          type = $4,
          status = $5,
          started_at = $6,
          ended_at = $7
        WHERE id = $1
      `,
      [
        shift.id,
        shift.siteId,
        shift.actorId,
        shift.type,
        shift.status,
        shift.startedAt,
        shift.endedAt,
      ],
    );

    if (result.rowCount !== 1) {
      throw new Error('Shift was not updated.');
    }
  }

  private toShiftRecord(row: {
    id: string;
    site_id: string;
    operator_id: string;
    type: string;
    status: string;
    started_at: Date;
    ended_at: Date | null;
  }): ShiftRecord {
    return {
      id: row.id,
      siteId: row.site_id,
      actorId: row.operator_id,
      type: row.type,
      status: row.status,
      startedAt: row.started_at,
      endedAt: row.ended_at,
    };
  }
}
