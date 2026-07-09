export class CaptureEvidenceRequestDto {
  actorId!: string;
  caption?: string | null;
  content!: Buffer;
  mimeType!: string;
  storageReference!: string;
}

export type CaptureEvidenceResponseDto = {
  evidenceId: string;
};
