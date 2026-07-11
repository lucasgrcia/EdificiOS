import { IncidentTimelineView } from '../src/operations/application/incident-timeline';
import {
  EVIDENCE_ASSOCIATED_TIMELINE_TYPE,
  WORK_ORDER_CREATED_TIMELINE_TYPE,
} from '../src/operations/application/map-incident-timeline';
import { PostgresIncidentTimelineRepository } from '../src/operations/infrastructure/persistence/postgres-incident-timeline-repository';

describe('PostgresIncidentTimelineRepository integration', () => {
  const incidentId = '00000000-0000-0000-0000-000000000101';
  const otherIncidentId = '00000000-0000-0000-0000-000000000102';
  const detectionActorId = '00000000-0000-0000-0000-000000000020';
  const assignedActorId = '00000000-0000-0000-0000-000000000021';
  const workOrderActorId = '00000000-0000-0000-0000-000000000022';
  const detectedEventId = '00000000-0000-0000-0000-000000000201';
  const assignedEventId = '00000000-0000-0000-0000-000000000202';
  const resolvedEventId = '00000000-0000-0000-0000-000000000203';
  const firstEvidenceId = '00000000-0000-0000-0000-000000000301';
  const secondEvidenceId = '00000000-0000-0000-0000-000000000302';

  type EventRecord = {
    id: string;
    incident_id: string;
    name: string;
    payload: Record<string, unknown>;
    actor_id: string | null;
    occurred_at: Date;
  };

  type EventEvidenceRecord = {
    event_id: string;
    evidence_id: string;
  };

  type WorkOrderRecord = {
    incident_id: string;
    actor_id: string;
    description: string;
    created_at: Date;
  };

  type NotificationRecord = {
    recipient_id: string;
    type: string;
    message: string;
    created_at: Date;
  };

  function createInMemoryPool() {
    const events = new Map<string, EventRecord>();
    const eventEvidences: EventEvidenceRecord[] = [];
    const workOrders: WorkOrderRecord[] = [];
    const notifications: NotificationRecord[] = [];

    return {
      query: jest.fn(async (sql: string, values?: unknown[]) => {
        const [queryIncidentId] = values as [string];

        if (sql.includes('FROM notifications n')) {
          const incidentEvents = [...events.values()].filter(
            (event) => event.incident_id === queryIncidentId,
          );
          const incidentActors = new Set<string>();

          for (const workOrder of workOrders) {
            if (workOrder.incident_id === queryIncidentId) {
              incidentActors.add(workOrder.actor_id);
            }
          }

          for (const event of incidentEvents) {
            if (event.actor_id !== null) {
              incidentActors.add(event.actor_id);
            }

            const payloadActorId = event.payload.actorId;

            if (typeof payloadActorId === 'string') {
              incidentActors.add(payloadActorId);
            }
          }

          const detectedEvent = incidentEvents.find(
            (event) => event.name === 'workflow.flow.detected',
          );

          const rows = notifications
            .filter((notification) => {
              if (incidentActors.has(notification.recipient_id)) {
                return true;
              }

              if (
                notification.type === 'INCIDENT_DETECTED' &&
                detectedEvent !== undefined
              ) {
                const windowEnd = new Date(
                  detectedEvent.occurred_at.getTime() + 60_000,
                );

                return (
                  notification.created_at >= detectedEvent.occurred_at &&
                  notification.created_at <= windowEnd
                );
              }

              return false;
            })
            .sort(
              (left, right) =>
                left.created_at.getTime() - right.created_at.getTime(),
            );

          return { rowCount: rows.length, rows };
        }

        if (sql.includes('FROM event_evidences ee')) {
          const rows = eventEvidences
            .map((association) => {
              const event = events.get(association.event_id);

              if (event === undefined || event.incident_id !== queryIncidentId) {
                return null;
              }

              return {
                evidence_id: association.evidence_id,
                actor_id: event.actor_id,
                payload: event.payload,
                occurred_at: event.occurred_at,
              };
            })
            .filter((row) => row !== null)
            .sort(
              (left, right) =>
                left.occurred_at.getTime() - right.occurred_at.getTime(),
            );

          return { rowCount: rows.length, rows };
        }

        if (
          sql.includes('FROM work_orders') &&
          !sql.includes('FROM notifications n')
        ) {
          const rows = workOrders
            .filter((workOrder) => workOrder.incident_id === queryIncidentId)
            .sort(
              (left, right) =>
                left.created_at.getTime() - right.created_at.getTime(),
            );

          return { rowCount: rows.length, rows };
        }

        if (
          sql.includes('FROM events') &&
          !sql.includes('event_evidences') &&
          !sql.includes('FROM notifications n')
        ) {
          const rows = [...events.values()]
            .filter((event) => event.incident_id === queryIncidentId)
            .sort(
              (left, right) =>
                left.occurred_at.getTime() - right.occurred_at.getTime(),
            )
            .map((event) => ({
              name: event.name,
              payload: event.payload,
              actor_id: event.actor_id,
              occurred_at: event.occurred_at,
            }));

          return { rowCount: rows.length, rows };
        }

        throw new Error(`Unexpected query: ${sql}`);
      }),
      seedEvent: (event: EventRecord) => {
        events.set(event.id, event);
      },
      seedEventEvidence: (association: EventEvidenceRecord) => {
        eventEvidences.push(association);
      },
      seedWorkOrder: (workOrder: WorkOrderRecord) => {
        workOrders.push(workOrder);
      },
      seedNotification: (notification: NotificationRecord) => {
        notifications.push(notification);
      },
    };
  }

  it('returns an empty timeline when incident has no related records', async () => {
    const pool = createInMemoryPool();
    const repository = new PostgresIncidentTimelineRepository(pool as never);

    const result = await repository.findTimelineByIncidentId(incidentId);

    expect(result).toEqual({
      incidentId,
      entries: [],
    });
  });

  it('builds a complete timeline from events, evidences, work orders and notifications', async () => {
    const pool = createInMemoryPool();
    pool.seedEvent({
      id: detectedEventId,
      incident_id: incidentId,
      name: 'workflow.flow.detected',
      payload: { description: 'Fuga en bomba principal.' },
      actor_id: null,
      occurred_at: new Date('2026-07-10T10:00:00.000Z'),
    });
    pool.seedEvent({
      id: assignedEventId,
      incident_id: incidentId,
      name: 'workflow.flow.assigned',
      payload: { actorId: assignedActorId },
      actor_id: assignedActorId,
      occurred_at: new Date('2026-07-10T10:10:00.000Z'),
    });
    pool.seedEvent({
      id: resolvedEventId,
      incident_id: incidentId,
      name: 'workflow.flow.resolved',
      payload: {},
      actor_id: null,
      occurred_at: new Date('2026-07-10T11:00:00.000Z'),
    });
    pool.seedEventEvidence({
      event_id: assignedEventId,
      evidence_id: firstEvidenceId,
    });
    pool.seedWorkOrder({
      incident_id: incidentId,
      actor_id: workOrderActorId,
      description: 'Reparar bomba principal',
      created_at: new Date('2026-07-10T10:20:00.000Z'),
    });
    pool.seedNotification({
      recipient_id: detectionActorId,
      type: 'INCIDENT_DETECTED',
      message: 'Se detectó una nueva incidencia.',
      created_at: new Date('2026-07-10T10:00:05.000Z'),
    });
    pool.seedNotification({
      recipient_id: workOrderActorId,
      type: 'WORK_ORDER_CREATED',
      message: 'Se creó una orden de trabajo.',
      created_at: new Date('2026-07-10T10:20:05.000Z'),
    });
    const repository = new PostgresIncidentTimelineRepository(pool as never);

    const result = await repository.findTimelineByIncidentId(incidentId);

    const expectedTimeline: IncidentTimelineView = {
      incidentId,
      entries: [
        {
          timestamp: '2026-07-10T10:00:00.000Z',
          type: 'workflow.flow.detected',
          description: 'Fuga en bomba principal.',
          actorId: null,
        },
        {
          timestamp: '2026-07-10T10:00:05.000Z',
          type: 'INCIDENT_DETECTED',
          description: 'Se detectó una nueva incidencia.',
          actorId: detectionActorId,
        },
        {
          timestamp: '2026-07-10T10:10:00.000Z',
          type: 'workflow.flow.assigned',
          description: 'Incidencia asignada.',
          actorId: assignedActorId,
        },
        {
          timestamp: '2026-07-10T10:10:00.000Z',
          type: EVIDENCE_ASSOCIATED_TIMELINE_TYPE,
          description: `Evidencia asociada (${firstEvidenceId})`,
          actorId: assignedActorId,
        },
        {
          timestamp: '2026-07-10T10:20:00.000Z',
          type: WORK_ORDER_CREATED_TIMELINE_TYPE,
          description: 'Reparar bomba principal',
          actorId: workOrderActorId,
        },
        {
          timestamp: '2026-07-10T10:20:05.000Z',
          type: 'WORK_ORDER_CREATED',
          description: 'Se creó una orden de trabajo.',
          actorId: workOrderActorId,
        },
        {
          timestamp: '2026-07-10T11:00:00.000Z',
          type: 'workflow.flow.resolved',
          description: 'Incidencia resuelta.',
          actorId: null,
        },
      ],
    };

    expect(result).toEqual(expectedTimeline);
  });

  it('orders timeline entries chronologically ascending', async () => {
    const pool = createInMemoryPool();
    pool.seedEvent({
      id: resolvedEventId,
      incident_id: incidentId,
      name: 'workflow.flow.resolved',
      payload: {},
      actor_id: null,
      occurred_at: new Date('2026-07-10T12:00:00.000Z'),
    });
    pool.seedEvent({
      id: detectedEventId,
      incident_id: incidentId,
      name: 'workflow.flow.detected',
      payload: { description: 'Ascensor detenido.' },
      actor_id: null,
      occurred_at: new Date('2026-07-10T10:00:00.000Z'),
    });
    pool.seedWorkOrder({
      incident_id: incidentId,
      actor_id: workOrderActorId,
      description: 'Revisar motor',
      created_at: new Date('2026-07-10T11:00:00.000Z'),
    });
    const repository = new PostgresIncidentTimelineRepository(pool as never);

    const result = await repository.findTimelineByIncidentId(incidentId);

    expect(result.entries.map((entry) => entry.timestamp)).toEqual([
      '2026-07-10T10:00:00.000Z',
      '2026-07-10T11:00:00.000Z',
      '2026-07-10T12:00:00.000Z',
    ]);
  });

  it('does not duplicate entries or include records from other incidents', async () => {
    const pool = createInMemoryPool();
    pool.seedEvent({
      id: detectedEventId,
      incident_id: incidentId,
      name: 'workflow.flow.detected',
      payload: { description: 'Misma descripción.' },
      actor_id: null,
      occurred_at: new Date('2026-07-10T10:00:00.000Z'),
    });
    pool.seedEvent({
      id: '00000000-0000-0000-0000-000000000299',
      incident_id: otherIncidentId,
      name: 'workflow.flow.detected',
      payload: { description: 'Misma descripción.' },
      actor_id: null,
      occurred_at: new Date('2026-07-10T10:00:00.000Z'),
    });
    pool.seedEventEvidence({
      event_id: detectedEventId,
      evidence_id: firstEvidenceId,
    });
    pool.seedEventEvidence({
      event_id: detectedEventId,
      evidence_id: secondEvidenceId,
    });
    pool.seedNotification({
      recipient_id: detectionActorId,
      type: 'INCIDENT_DETECTED',
      message: 'Se detectó una nueva incidencia.',
      created_at: new Date('2026-07-10T10:00:05.000Z'),
    });
    pool.seedNotification({
      recipient_id: detectionActorId,
      type: 'INCIDENT_DETECTED',
      message: 'Se detectó una nueva incidencia.',
      created_at: new Date('2026-07-10T10:00:05.000Z'),
    });
    const repository = new PostgresIncidentTimelineRepository(pool as never);

    const result = await repository.findTimelineByIncidentId(incidentId);

    expect(result.entries).toEqual([
      {
        timestamp: '2026-07-10T10:00:00.000Z',
        type: 'workflow.flow.detected',
        description: 'Misma descripción.',
        actorId: null,
      },
      {
        timestamp: '2026-07-10T10:00:00.000Z',
        type: EVIDENCE_ASSOCIATED_TIMELINE_TYPE,
        description: `Evidencia asociada (${firstEvidenceId})`,
        actorId: null,
      },
      {
        timestamp: '2026-07-10T10:00:00.000Z',
        type: EVIDENCE_ASSOCIATED_TIMELINE_TYPE,
        description: `Evidencia asociada (${secondEvidenceId})`,
        actorId: null,
      },
      {
        timestamp: '2026-07-10T10:00:05.000Z',
        type: 'INCIDENT_DETECTED',
        description: 'Se detectó una nueva incidencia.',
        actorId: detectionActorId,
      },
    ]);
    expect(pool.query).toHaveBeenCalledTimes(4);
    expect(pool.query.mock.calls.every((call) => call[1]?.[0] === incidentId)).toBe(
      true,
    );
  });

  it('reads timeline sources without using incidents projection or replay', async () => {
    const queries: Array<{ sql: string; values: unknown[] }> = [];
    const pool = {
      query: jest.fn(async (sql: string, values?: unknown[]) => {
        queries.push({ sql: sql.trim(), values: values ?? [] });
        return { rowCount: 0, rows: [] };
      }),
    };
    const repository = new PostgresIncidentTimelineRepository(pool as never);

    await repository.findTimelineByIncidentId(incidentId);

    expect(queries).toHaveLength(4);
    expect(queries.some((query) => query.sql.includes('FROM events'))).toBe(true);
    expect(
      queries.some((query) => query.sql.includes('FROM event_evidences ee')),
    ).toBe(true);
    expect(queries.some((query) => query.sql.includes('FROM work_orders'))).toBe(
      true,
    );
    expect(queries.some((query) => query.sql.includes('FROM notifications n'))).toBe(
      true,
    );
    expect(
      queries.every((query) => !query.sql.includes('current_projection_state')),
    ).toBe(true);
    expect(queries.every((query) => !query.sql.includes('FROM incidents'))).toBe(
      true,
    );
  });
});
