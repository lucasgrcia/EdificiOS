import { Pool } from 'pg';

import {
  EvidenceMetadataRecord,
  EvidenceRepository,
} from '../../application/evidence-persistence';
import { MimeType } from '../../domain/evidence/value-objects/mime-type';
import { StorageReference } from '../../domain/evidence/value-objects/storage-reference';

export class PostgresEvidenceRepository implements EvidenceRepository {
  constructor(private readonly pool: Pool) {}

  async save(metadata: EvidenceMetadataRecord): Promise<void> {
    await this.pool.query(
      `
        INSERT INTO evidences (
          id,
          storage_reference,
          hash_sha256,
          mime_type,
          size_bytes,
          captured_at
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        metadata.id,
        metadata.storageReference.toString(),
        metadata.hashSha256,
        metadata.mimeType.toString(),
        metadata.sizeBytes,
        metadata.capturedAt,
      ],
    );
  }

  async findById(id: string): Promise<EvidenceMetadataRecord | null> {
    const result = await this.pool.query(
      `
        SELECT
          id,
          storage_reference,
          hash_sha256,
          mime_type,
          size_bytes,
          captured_at
        FROM evidences
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
      storageReference: StorageReference.create(row.storage_reference),
      hashSha256: row.hash_sha256,
      mimeType: MimeType.create(row.mime_type),
      sizeBytes: Number(row.size_bytes),
      capturedAt: row.captured_at,
    };
  }
}
