import { createHash } from 'node:crypto';

import {
  CaptureEvidenceUseCase,
  sha256HashCalculator,
} from '../src/operations/application/capture-evidence-use-case';
import {
  EvidenceMetadataRecord,
  EvidenceRepository,
} from '../src/operations/application/evidence-persistence';
import {
  EventEvidenceAssociation,
  EventEvidenceRepository,
} from '../src/operations/application/event-evidence-persistence';
import { FileStorage, StoreFileInput } from '../src/operations/application/file-storage';
import { MimeType } from '../src/operations/domain/evidence/value-objects/mime-type';
import { StorageReference } from '../src/operations/domain/evidence/value-objects/storage-reference';

describe('CaptureEvidenceUseCase integration', () => {
  const eventId = '00000000-0000-0000-0000-000000000010';
  const evidenceId = '00000000-0000-0000-0000-000000000001';
  const actorId = '00000000-0000-0000-0000-000000000020';
  const capturedAt = new Date('2026-07-07T10:00:00.000Z');
  const content = Buffer.from('physical-proof-bytes');
  const storageReference = '2026/07/bomba-principal.jpg';
  const expectedHash = createHash('sha256').update(content).digest('hex');

  function createHarness(options?: {
    evidenceIds?: string[];
    fileStorage?: Partial<FileStorage>;
    evidenceRepository?: Partial<EvidenceRepository>;
    eventEvidenceRepository?: Partial<EventEvidenceRepository>;
  }) {
    const evidenceIds = [...(options?.evidenceIds ?? [evidenceId])];
    const storedFiles: StoreFileInput[] = [];
    const deletedStorageReferences: string[] = [];
    const savedMetadata: EvidenceMetadataRecord[] = [];
    const associations: EventEvidenceAssociation[] = [];

    const fileStorage: FileStorage = {
      store: async (input) => {
        storedFiles.push(input);
        return options?.fileStorage?.store?.(input) ?? {
          storageReference: input.storageReference,
          sizeBytes: input.content.byteLength,
        };
      },
      read: async () => content,
      delete: async (reference) => {
        deletedStorageReferences.push(reference);
        await options?.fileStorage?.delete?.(reference);
      },
    };

    const evidenceRepository: EvidenceRepository = {
      save: async (metadata) => {
        savedMetadata.push(metadata);
        await options?.evidenceRepository?.save?.(metadata);
      },
      findById: async () => null,
      ...options?.evidenceRepository,
    };

    const eventEvidenceRepository: EventEvidenceRepository = {
      associate: async (association) => {
        associations.push(association);
        await options?.eventEvidenceRepository?.associate?.(association);
      },
      findEvidenceIdsByEventId: async () => [],
      findEventIdsByEvidenceId: async () => [],
      ...options?.eventEvidenceRepository,
    };

    const useCase = new CaptureEvidenceUseCase({
      fileStorage,
      evidenceRepository,
      eventEvidenceRepository,
      idGenerator: {
        generate: () => {
          const nextEvidenceId = evidenceIds.shift();

          if (nextEvidenceId === undefined) {
            throw new Error('No evidence id available.');
          }

          return nextEvidenceId;
        },
      },
      clock: {
        now: () => capturedAt,
      },
      hashCalculator: sha256HashCalculator,
    });

    return {
      useCase,
      storedFiles,
      deletedStorageReferences,
      savedMetadata,
      associations,
    };
  }

  it('captures evidence by storing the file, metadata and event association', async () => {
    const harness = createHarness();

    const result = await harness.useCase.execute({
      eventId,
      actorId,
      content,
      mimeType: 'image/jpeg',
      storageReference,
      caption: 'Olor a quemado en bomba principal.',
    });

    expect(result).toEqual({ evidenceId });
    expect(harness.storedFiles).toEqual([
      {
        storageReference,
        content,
      },
    ]);
    expect(harness.savedMetadata).toEqual([
      {
        id: evidenceId,
        storageReference: StorageReference.create(storageReference),
        hashSha256: expectedHash,
        mimeType: MimeType.create('image/jpeg'),
        sizeBytes: content.byteLength,
        capturedAt,
      },
    ]);
    expect(harness.associations).toEqual([{ eventId, evidenceId }]);
    expect(harness.deletedStorageReferences).toEqual([]);
  });

  it('calculates the sha-256 hash before persisting metadata', async () => {
    const harness = createHarness();

    await harness.useCase.execute({
      eventId,
      actorId,
      content,
      mimeType: 'image/png',
      storageReference,
    });

    expect(harness.savedMetadata[0]?.hashSha256).toBe(expectedHash);
    expect(harness.savedMetadata[0]?.hashSha256).toHaveLength(64);
  });

  it('fails when physical storage fails and does not persist metadata or association', async () => {
    const storageFailure = new Error('file storage failed');
    const harness = createHarness({
      fileStorage: {
        store: async () => {
          throw storageFailure;
        },
      },
    });

    await expect(
      harness.useCase.execute({
        eventId,
        actorId,
        content,
        mimeType: 'image/jpeg',
        storageReference,
      }),
    ).rejects.toThrow(storageFailure);

    expect(harness.savedMetadata).toEqual([]);
    expect(harness.associations).toEqual([]);
    expect(harness.deletedStorageReferences).toEqual([]);
  });

  it('fails when metadata persistence fails and removes the stored file', async () => {
    const persistenceFailure = new Error('metadata persistence failed');
    const harness = createHarness({
      evidenceRepository: {
        save: async () => {
          throw persistenceFailure;
        },
      },
    });

    await expect(
      harness.useCase.execute({
        eventId,
        actorId,
        content,
        mimeType: 'image/jpeg',
        storageReference,
      }),
    ).rejects.toThrow(persistenceFailure);

    expect(harness.storedFiles).toHaveLength(1);
    expect(harness.associations).toEqual([]);
    expect(harness.deletedStorageReferences).toEqual([storageReference]);
  });

  it('creates distinct evidences for identical content because hash verifies integrity not identity', async () => {
    const firstEvidenceId = '00000000-0000-0000-0000-000000000001';
    const secondEvidenceId = '00000000-0000-0000-0000-000000000002';
    const secondEventId = '00000000-0000-0000-0000-000000000020';
    const harness = createHarness({
      evidenceIds: [firstEvidenceId, secondEvidenceId],
    });

    const firstResult = await harness.useCase.execute({
      eventId,
      actorId,
      content,
      mimeType: 'image/jpeg',
      storageReference: '2026/07/primera-captura.jpg',
    });
    const secondResult = await harness.useCase.execute({
      eventId: secondEventId,
      actorId,
      content,
      mimeType: 'image/jpeg',
      storageReference: '2026/07/segunda-captura.jpg',
    });

    expect(firstResult.evidenceId).toBe(firstEvidenceId);
    expect(secondResult.evidenceId).toBe(secondEvidenceId);
    expect(firstResult.evidenceId).not.toBe(secondResult.evidenceId);
    expect(harness.savedMetadata).toHaveLength(2);
    expect(harness.savedMetadata[0]?.hashSha256).toBe(expectedHash);
    expect(harness.savedMetadata[1]?.hashSha256).toBe(expectedHash);
    expect(harness.savedMetadata[0]?.id).not.toBe(harness.savedMetadata[1]?.id);
  });
});
