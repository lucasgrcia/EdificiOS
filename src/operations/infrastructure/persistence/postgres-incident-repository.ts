import { PoolClient } from 'pg';

import {
  IncidentRecord,
  IncidentRepository,
} from '../../application/detect-incident-use-case';

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
}
