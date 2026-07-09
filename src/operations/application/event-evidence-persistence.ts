export type EventEvidenceAssociation = {
  eventId: string;
  evidenceId: string;
};

export interface EventEvidenceRepository {
  associate(association: EventEvidenceAssociation): Promise<void>;
  findEvidenceIdsByEventId(eventId: string): Promise<string[]>;
  findEventIdsByEvidenceId(evidenceId: string): Promise<string[]>;
}
