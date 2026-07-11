import { GetIncidentTimelineUseCase } from '../src/operations/application/get-incident-timeline-use-case';
import { IncidentTimelineView } from '../src/operations/application/incident-timeline';

describe('GetIncidentTimelineUseCase integration', () => {
  const incidentId = '00000000-0000-0000-0000-000000000101';
  const timeline: IncidentTimelineView = {
    incidentId,
    entries: [
      {
        timestamp: '2026-07-10T10:00:00.000Z',
        type: 'workflow.flow.detected',
        description: 'Fuga en bomba principal.',
        actorId: null,
      },
      {
        timestamp: '2026-07-10T10:10:00.000Z',
        type: 'workflow.flow.assigned',
        description: 'Incidencia asignada.',
        actorId: '00000000-0000-0000-0000-000000000021',
      },
    ],
  };

  it('delegates timeline lookup to IncidentTimelineRepository', async () => {
    const incidentTimelineRepository = {
      findTimelineByIncidentId: jest.fn().mockResolvedValue(timeline),
    };
    const useCase = new GetIncidentTimelineUseCase({
      incidentTimelineRepository,
    });

    const result = await useCase.execute({ incidentId });

    expect(result).toEqual(timeline);
    expect(incidentTimelineRepository.findTimelineByIncidentId).toHaveBeenCalledWith(
      incidentId,
    );
  });

  it('returns an empty timeline when repository has no entries', async () => {
    const incidentTimelineRepository = {
      findTimelineByIncidentId: jest.fn().mockResolvedValue({
        incidentId,
        entries: [],
      }),
    };
    const useCase = new GetIncidentTimelineUseCase({
      incidentTimelineRepository,
    });

    const result = await useCase.execute({ incidentId });

    expect(result).toEqual({
      incidentId,
      entries: [],
    });
  });
});
