import { ActorId } from './value-objects/actor-id';
import { CapturedAt } from './value-objects/captured-at';
import { EvidenceCaption } from './value-objects/evidence-caption';
import { EvidenceId } from './value-objects/evidence-id';
import { StorageReference } from './value-objects/storage-reference';

export type CaptureEvidenceInput = {
  evidenceId: string;
  actorId: string;
  storageReference: string;
  caption?: string | null;
  capturedAt: Date;
  asOf?: Date;
};

export class Evidence {
  private constructor(
    private readonly evidenceIdentifier: EvidenceId,
    private readonly actorIdentifier: ActorId,
    private readonly storageReferenceValue: StorageReference,
    private readonly optionalCaption: EvidenceCaption | null,
    private readonly capturedAtValue: CapturedAt,
  ) {}

  static capture(input: CaptureEvidenceInput): Evidence {
    const referenceTime = input.asOf ?? input.capturedAt;

    return new Evidence(
      EvidenceId.create(input.evidenceId),
      ActorId.create(input.actorId),
      StorageReference.create(input.storageReference),
      input.caption === undefined || input.caption === null
        ? null
        : EvidenceCaption.create(input.caption),
      CapturedAt.create(input.capturedAt, referenceTime),
    );
  }

  get id(): string {
    return this.evidenceIdentifier.toString();
  }

  get actorId(): string {
    return this.actorIdentifier.toString();
  }

  get storageReference(): StorageReference {
    return this.storageReferenceValue;
  }

  get caption(): string | null {
    return this.optionalCaption?.toString() ?? null;
  }

  get capturedAt(): Date {
    return this.capturedAtValue.toDate();
  }
}
