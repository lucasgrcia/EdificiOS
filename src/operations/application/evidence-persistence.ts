import { MimeType } from '../domain/evidence/value-objects/mime-type';
import { StorageReference } from '../domain/evidence/value-objects/storage-reference';

export type EvidenceMetadataRecord = {
  id: string;
  storageReference: StorageReference;
  hashSha256: string;
  mimeType: MimeType;
  sizeBytes: number;
  capturedAt: Date;
};

export interface EvidenceRepository {
  save(metadata: EvidenceMetadataRecord): Promise<void>;
  findById(id: string): Promise<EvidenceMetadataRecord | null>;
}
