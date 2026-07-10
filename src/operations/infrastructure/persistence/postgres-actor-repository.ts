import { Pool } from 'pg';

import {
  ActorRecord,
  ActorRepository,
} from '../../application/actor-persistence';

export class PostgresActorRepository implements ActorRepository {
  constructor(private readonly pool: Pool) {}

  async save(actor: ActorRecord): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO actors (
          id,
          site_id,
          name,
          role,
          status
        )
        VALUES ($1, $2, $3, $4, $5)
      `,
      [actor.id, actor.siteId, actor.name, actor.role, actor.status],
    );
  }

  async findById(id: string): Promise<ActorRecord | null> {
    const result = await this.pool.query(
      `
        SELECT
          id,
          site_id,
          name,
          role,
          status
        FROM actors
        WHERE id = $1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.toActorRecord(result.rows[0]);
  }

  async findBySite(siteId: string): Promise<ActorRecord[]> {
    const result = await this.pool.query(
      `
        SELECT
          id,
          site_id,
          name,
          role,
          status
        FROM actors
        WHERE site_id = $1
        ORDER BY name
      `,
      [siteId],
    );

    return result.rows.map((row) => this.toActorRecord(row));
  }

  private toActorRecord(row: {
    id: string;
    site_id: string;
    name: string;
    role: string;
    status: string;
  }): ActorRecord {
    return {
      id: row.id,
      siteId: row.site_id,
      name: row.name,
      role: row.role,
      status: row.status,
    };
  }
}
