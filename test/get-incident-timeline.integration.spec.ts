import { GetIncidentTimelineUseCase } from '../src/operations/application/get-incident-timeline-use-case';
import { IncidentTimelineView } from '../src/operations/application/incident-timeline';
import { NOTIFICATION_TIMELINE_TYPE } from '../src/operations/application/map-incident-timeline';
import { NotificationQueryRepository } from '../src/operations/application/notification-query-persistence';

describe('GetIncidentTimelineUseCase integration', () => {
  const incidentId = '00000000-0000-0000-0000-000000000101';
  const recipientId = '00000000-0000-0000-0000-000000000021';
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
        actorId: recipientId,
      },
    ],
  };

  function createUseCase(options?: {
    timeline?: IncidentTimelineView;
    recentNotifications?: Array<{
      id: string;
      recipientId: string;
      type: string;
      message: string;
      createdAt: string;
    }>;
  }) {
    const incidentTimelineRepository = {
      findTimelineByIncidentId: jest
        .fn()
        .mockResolvedValue(options?.timeline ?? timeline),
    };
    const notificationQueryRepository: NotificationQueryRepository = {
      findById: jest.fn(),
      findByRecipient: jest.fn(),
      findRecent: jest
        .fn()
        .mockResolvedValue(options?.recentNotifications ?? []),
    };

    return {
      useCase: new GetIncidentTimelineUseCase({
        incidentTimelineRepository,
        notificationQueryRepository,
      }),
      incidentTimelineRepository,
      notificationQueryRepository,
    };
  }

  it('delegates timeline lookup to IncidentTimelineRepository', async () => {
    const { useCase, incidentTimelineRepository } = createUseCase();

    const result = await useCase.execute({ incidentId });

    expect(result).toEqual(timeline);
    expect(incidentTimelineRepository.findTimelineByIncidentId).toHaveBeenCalledWith(
      incidentId,
    );
  });

  it('returns an empty timeline when repository has no entries', async () => {
    const { useCase } = createUseCase({
      timeline: {
        incidentId,
        entries: [],
      },
    });

    const result = await useCase.execute({ incidentId });

    expect(result).toEqual({
      incidentId,
      entries: [],
    });
  });

  it('includes incident notifications in the timeline', async () => {
    const { useCase } = createUseCase({
      recentNotifications: [
        {
          id: '00000000-0000-0000-0000-000000000501',
          recipientId,
          type: 'INCIDENT_DETECTED',
          message: 'Se detectó una nueva incidencia.',
          createdAt: '2026-07-10T10:00:05.000Z',
        },
        {
          id: '00000000-0000-0000-0000-000000000502',
          recipientId,
          type: 'INCIDENT_ASSIGNED',
          message: 'Se te asignó una incidencia.',
          createdAt: '2026-07-10T10:10:05.000Z',
        },
      ],
    });

    const result = await useCase.execute({ incidentId });

    expect(result.entries).toEqual(
      expect.arrayContaining([
        {
          timestamp: '2026-07-10T10:00:05.000Z',
          type: NOTIFICATION_TIMELINE_TYPE,
          description: 'Se detectó una nueva incidencia.',
          actorId: recipientId,
        },
        {
          timestamp: '2026-07-10T10:10:05.000Z',
          type: NOTIFICATION_TIMELINE_TYPE,
          description: 'Se te asignó una incidencia.',
          actorId: recipientId,
        },
      ]),
    );
  });

  it('merges timeline entries in chronological order', async () => {
    const { useCase } = createUseCase({
      recentNotifications: [
        {
          id: '00000000-0000-0000-0000-000000000503',
          recipientId,
          type: 'INCIDENT_RESOLVED',
          message: 'La incidencia fue resuelta correctamente.',
          createdAt: '2026-07-10T10:15:00.000Z',
        },
      ],
    });

    const result = await useCase.execute({ incidentId });

    expect(result.entries.map((entry) => entry.timestamp)).toEqual([
      '2026-07-10T10:00:00.000Z',
      '2026-07-10T10:10:00.000Z',
      '2026-07-10T10:15:00.000Z',
    ]);
  });

  it('includes only incident lifecycle notification types', async () => {
    const { useCase, notificationQueryRepository } = createUseCase({
      recentNotifications: [
        {
          id: '00000000-0000-0000-0000-000000000501',
          recipientId,
          type: 'INCIDENT_DETECTED',
          message: 'Se detectó una nueva incidencia.',
          createdAt: '2026-07-10T10:00:05.000Z',
        },
        {
          id: '00000000-0000-0000-0000-000000000504',
          recipientId,
          type: 'SHIFT_STARTED',
          message: 'El turno comenzó.',
          createdAt: '2026-07-10T10:12:00.000Z',
        },
      ],
    });

    const result = await useCase.execute({ incidentId });

    expect(notificationQueryRepository.findRecent).toHaveBeenCalledWith(100);
    expect(
      result.entries.filter((entry) => entry.type === NOTIFICATION_TIMELINE_TYPE),
    ).toEqual([
      {
        timestamp: '2026-07-10T10:00:05.000Z',
        type: NOTIFICATION_TIMELINE_TYPE,
        description: 'Se detectó una nueva incidencia.',
        actorId: recipientId,
      },
    ]);
  });

  it('ignores work order notification types', async () => {
    const { useCase } = createUseCase({
      recentNotifications: [
        {
          id: '00000000-0000-0000-0000-000000000505',
          recipientId,
          type: 'WORK_ORDER_STARTED',
          message: 'Comenzó una orden de trabajo asignada a ti.',
          createdAt: '2026-07-10T10:20:00.000Z',
        },
        {
          id: '00000000-0000-0000-0000-000000000506',
          recipientId,
          type: 'WORK_ORDER_COMPLETED',
          message: 'Finalizaste una orden de trabajo.',
          createdAt: '2026-07-10T10:25:00.000Z',
        },
        {
          id: '00000000-0000-0000-0000-000000000507',
          recipientId,
          type: 'INCIDENT_RESOLVED',
          message: 'La incidencia fue resuelta correctamente.',
          createdAt: '2026-07-10T10:30:00.000Z',
        },
      ],
    });

    const result = await useCase.execute({ incidentId });

    expect(
      result.entries.filter((entry) => entry.type === NOTIFICATION_TIMELINE_TYPE),
    ).toEqual([
      {
        timestamp: '2026-07-10T10:30:00.000Z',
        type: NOTIFICATION_TIMELINE_TYPE,
        description: 'La incidencia fue resuelta correctamente.',
        actorId: recipientId,
      },
    ]);
  });
});
