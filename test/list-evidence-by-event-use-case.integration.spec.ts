import { EvidenceQueryRepository } from '../src/operations/application/evidence-query-persistence';
import { EvidenceView } from '../src/operations/application/evidence-view';
import { ListEvidenceByEventUseCase } from '../src/operations/application/list-evidence-by-event-use-case';

describe('ListEvidenceByEventUseCase integration', () => {
  const eventId = '00000000-0000-0000-0000-000000000010';
  const evidenceView: EvidenceView = {
    id: '00000000-0000-0000-0000-000000000001',
    storageReference: '2026/07/event-1/bomba.jpg',
    hashSha256: 'a'.repeat(64),
    mimeType: 'image/jpeg',
    sizeBytes: 1024,
    capturedAt: '2026-07-07T15:00:00.000Z',
  };

  it('returns evidence metadata for the event', async () => {
    const evidenceQueryRepository: EvidenceQueryRepository = {
      findByEventId: jest.fn(async () => [evidenceView]),
    };
    const useCase = new ListEvidenceByEventUseCase({
      evidenceQueryRepository,
    });

    const result = await useCase.execute({ eventId });

    expect(result).toEqual([evidenceView]);
    expect(evidenceQueryRepository.findByEventId).toHaveBeenCalledWith(eventId);
  });

  it('returns an empty list when event has no evidence', async () => {
    const evidenceQueryRepository: EvidenceQueryRepository = {
      findByEventId: jest.fn(async () => []),
    };
    const useCase = new ListEvidenceByEventUseCase({
      evidenceQueryRepository,
    });

    const result = await useCase.execute({ eventId });

    expect(result).toEqual([]);
  });
});
