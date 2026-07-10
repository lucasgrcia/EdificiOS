import { Pool } from 'pg';

import {
  IncidentQueryFilters,
  IncidentQueryRepository,
} from '../../application/incident-query-persistence';
import { IncidentView } from '../../application/incident-view';
import {
  IncidentQueryRow,
  toIncidentView,
} from '../../application/map-incident-view';

export class PostgresIncidentQueryRepository implements IncidentQueryRepository {
  constructor(private readonly pool: Pool) {}

  async findById(id: string): Promise<IncidentView | null> {
    const result = await this.pool.query<IncidentQueryRow>(
      `
        SELECT
          id,
          description,
          current_projection_state,
          created_at
        FROM incidents
        WHERE id = $1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return toIncidentView(result.rows[0]);
  }

  async findAll(filters: IncidentQueryFilters): Promise<IncidentView[]> {
    if (filters.assetIds !== undefined && filters.assetIds.length === 0) {
      return [];
    }

    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.status !== undefined) {
      values.push(filters.status);
      conditions.push(
        `current_projection_state->>'status' = $${values.length}`,
      );
    }

    if (filters.assetId !== undefined) {
      values.push(filters.assetId);
      conditions.push(
        `current_projection_state->>'assetId' = $${values.length}`,
      );
    } else if (filters.assetIds !== undefined) {
      values.push(filters.assetIds);
      conditions.push(
        `current_projection_state->>'assetId' = ANY($${values.length}::text[])`,
      );
    }

    if (filters.shiftId !== undefined) {
      values.push(filters.shiftId);
      conditions.push(
        `current_projection_state->>'shiftId' = $${values.length}`,
      );
    }

    if (filters.actorId !== undefined) {
      values.push(filters.actorId);
      conditions.push(
        `current_projection_state->>'actorId' = $${values.length}`,
      );
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await this.pool.query<IncidentQueryRow>(
      `
        SELECT
          id,
          description,
          current_projection_state,
          created_at
        FROM incidents
        ${whereClause}
        ORDER BY created_at DESC
      `,
      values,
    );

    return result.rows.map((row) => toIncidentView(row));
  }
}
