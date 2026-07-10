import { EvidenceView } from './evidence-view';

export interface EvidenceQueryRepository {
  findByEventId(eventId: string): Promise<EvidenceView[]>;
}
