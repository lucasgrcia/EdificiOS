import { EvidenceView } from './evidence-view';

export type EvidenceQueryRow = {
  id: string;
  storage_reference: string;
  hash_sha256: string;
  mime_type: string;
  size_bytes: string | number;
  captured_at: Date;
};

export function toEvidenceView(row: EvidenceQueryRow): EvidenceView {
  return {
    id: row.id,
    storageReference: row.storage_reference,
    hashSha256: row.hash_sha256,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    capturedAt: row.captured_at.toISOString(),
  };
}
