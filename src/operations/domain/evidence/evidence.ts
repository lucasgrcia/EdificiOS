import { ActorId } from './value-objects/actor-id';
import { CapturedAt } from './value-objects/captured-at';
import { EvidenceCaption } from './value-objects/evidence-caption';
import { EvidenceId } from './value-objects/evidence-id';
import { MediaReference } from './value-objects/media-reference';

export type CaptureEvidenceInput = {
  evidenceId: string;
  actorId: string;
  mediaReference: string;
  caption?: string | null;
  capturedAt: Date;
  asOf?: Date;
};

export class Evidence {
  private constructor(
    private readonly evidenceIdentifier: EvidenceId,
    private readonly actorIdentifier: ActorId,
    private readonly physicalProof: MediaReference,
    private readonly optionalCaption: EvidenceCaption | null,
    private readonly capturedAtValue: CapturedAt,
  ) {}

  static capture(input: CaptureEvidenceInput): Evidence {
    const referenceTime = input.asOf ?? input.capturedAt;

    return new Evidence(
      EvidenceId.create(input.evidenceId),
      ActorId.create(input.actorId),
      MediaReference.create(input.mediaReference),
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

  get mediaReference(): string {
    return this.physicalProof.toString();
  }

  get caption(): string | null {
    return this.optionalCaption?.toString() ?? null;
  }

  get capturedAt(): Date {
    return this.capturedAtValue.toDate();
  }
}
