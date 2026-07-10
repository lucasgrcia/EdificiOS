import { Pool } from 'pg';

import {
  SiteRecord,
  SiteRepository,
} from '../../application/site-persistence';

export class PostgresSiteRepository implements SiteRepository {
  constructor(private readonly pool: Pool) {}

  async save(site: SiteRecord): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO sites (
          id,
          name,
          address,
          timezone,
          building_type
        )
        VALUES ($1, $2, $3, $4, $5)
      `,
      [
        site.id,
        site.name,
        site.address,
        site.timeZone,
        site.buildingType,
      ],
    );
  }

  async findById(id: string): Promise<SiteRecord | null> {
    const result = await this.pool.query(
      `
        SELECT
          id,
          name,
          address,
          timezone,
          building_type
        FROM sites
        WHERE id = $1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.toSiteRecord(result.rows[0]);
  }

  async findAll(): Promise<SiteRecord[]> {
    const result = await this.pool.query(
      `
        SELECT
          id,
          name,
          address,
          timezone,
          building_type
        FROM sites
        ORDER BY name
      `,
    );

    return result.rows.map((row) => this.toSiteRecord(row));
  }

  private toSiteRecord(row: {
    id: string;
    name: string;
    address: string;
    timezone: string;
    building_type: string;
  }): SiteRecord {
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      timeZone: row.timezone,
      buildingType: row.building_type,
    };
  }
}
