import { PoolClient } from 'pg';

import {
  IncidentRecord,
  IncidentRepository,
} from '../../application/incident-persistence';

export class PostgresIncidentRepository implements IncidentRepository {
  constructor(private readonly client: PoolClient) {}

  async save(incident: IncidentRecord): Promise<void> {
    await this.client.query(
      `
        INSERT INTO incidents (
          id,
          description,
          current_projection_state,
          created_at
        )
        VALUES ($1, $2, $3::jsonb, $4)
      `,
      [
        incident.id,
        incident.description,
        JSON.stringify(incident.currentProjectionState),
        incident.createdAt,
      ],
    );
  }

  async findById(id: string): Promise<IncidentRecord | null> {
    const result = await this.client.query(
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

    const row = result.rows[0];

    return {
      id: row.id,
      description: row.description,
      currentProjectionState: row.current_projection_state,
      createdAt: row.created_at,
    };
  }

  async updateProjection(incident: IncidentRecord): Promise<void> {
    const result = await this.client.query(
      `
        UPDATE incidents
        SET current_projection_state = $2::jsonb
        WHERE id = $1
      `,
      [incident.id, JSON.stringify(incident.currentProjectionState)],
    );

    if (result.rowCount !== 1) {
      throw new Error('Incident projection was not updated.');
    }
  }
}
