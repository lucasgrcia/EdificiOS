import { createHash } from 'node:crypto';

import { Evidence } from '../domain/evidence/evidence';
import { MimeType } from '../domain/evidence/value-objects/mime-type';
import { EvidenceRepository } from './evidence-persistence';
import { EventEvidenceRepository } from './event-evidence-persistence';
import { FileStorage } from './file-storage';
import { Clock, IdGenerator } from './incident-persistence';

export type CaptureEvidenceCommand = {
  eventId: string;
  actorId: string;
  content: Buffer;
  mimeType: string;
  storageReference: string;
  caption?: string | null;
};

export type CaptureEvidenceResult = {
  evidenceId: string;
};

export interface HashCalculator {
  calculateSha256(content: Buffer): string;
}

export type CaptureEvidenceUseCaseDependencies = {
  fileStorage: FileStorage;
  evidenceRepository: EvidenceRepository;
  eventEvidenceRepository: EventEvidenceRepository;
  idGenerator: IdGenerator;
  clock: Clock;
  hashCalculator: HashCalculator;
};

export class CaptureEvidenceUseCase {
  constructor(
    private readonly dependencies: CaptureEvidenceUseCaseDependencies,
  ) {}

  async execute(
    command: CaptureEvidenceCommand,
  ): Promise<CaptureEvidenceResult> {
    const evidenceId = this.dependencies.idGenerator.generate();
    const capturedAt = this.dependencies.clock.now();
    const hashSha256 = this.dependencies.hashCalculator.calculateSha256(
      command.content,
    );

    const evidence = Evidence.capture({
      evidenceId,
      actorId: command.actorId,
      storageReference: command.storageReference,
      caption: command.caption,
      capturedAt,
    });

    let storedStorageReference: string | null = null;

    try {
      const storedFile = await this.dependencies.fileStorage.store({
        storageReference: evidence.storageReference.toString(),
        content: command.content,
      });
      storedStorageReference = storedFile.storageReference;

      await this.dependencies.evidenceRepository.save({
        id: evidence.id,
        storageReference: evidence.storageReference,
        hashSha256,
        mimeType: MimeType.create(command.mimeType),
        sizeBytes: storedFile.sizeBytes,
        capturedAt: evidence.capturedAt,
      });

      await this.dependencies.eventEvidenceRepository.associate({
        eventId: command.eventId,
        evidenceId: evidence.id,
      });

      return { evidenceId: evidence.id };
    } catch (error) {
      if (storedStorageReference !== null) {
        await this.dependencies.fileStorage
          .delete(storedStorageReference)
          .catch(() => undefined);
      }

      throw error;
    }
  }
}

export const sha256HashCalculator: HashCalculator = {
  calculateSha256(content: Buffer): string {
    return createHash('sha256').update(content).digest('hex');
  },
};
