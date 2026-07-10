import { Pool } from 'pg';

import {
  AssetRecord,
  AssetRepository,
} from '../../application/asset-persistence';

export class PostgresAssetRepository implements AssetRepository {
  constructor(private readonly pool: Pool) {}

  async save(asset: AssetRecord): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO assets (
          id,
          site_id,
          name,
          type,
          manufacturer,
          model,
          serial_number,
          location,
          criticality
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        asset.id,
        asset.siteId,
        asset.name,
        asset.type,
        asset.manufacturer,
        asset.model,
        asset.serialNumber,
        asset.location,
        asset.criticality,
      ],
    );
  }

  async findById(id: string): Promise<AssetRecord | null> {
    const result = await this.pool.query(
      `
        SELECT
          id,
          site_id,
          name,
          type,
          manufacturer,
          model,
          serial_number,
          location,
          criticality
        FROM assets
        WHERE id = $1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.toAssetRecord(result.rows[0]);
  }

  async findBySite(siteId: string): Promise<AssetRecord[]> {
    const result = await this.pool.query(
      `
        SELECT
          id,
          site_id,
          name,
          type,
          manufacturer,
          model,
          serial_number,
          location,
          criticality
        FROM assets
        WHERE site_id = $1
        ORDER BY name
      `,
      [siteId],
    );

    return result.rows.map((row) => this.toAssetRecord(row));
  }

  private toAssetRecord(row: {
    id: string;
    site_id: string;
    name: string;
    type: string;
    manufacturer: string | null;
    model: string | null;
    serial_number: string | null;
    location: string;
    criticality: string;
  }): AssetRecord {
    return {
      id: row.id,
      siteId: row.site_id,
      name: row.name,
      type: row.type,
      manufacturer: row.manufacturer,
      model: row.model,
      serialNumber: row.serial_number,
      location: row.location,
      criticality: row.criticality,
    };
  }
}
