import { Pool } from 'pg';

import {
  IncidentTimelineRepository,
  IncidentTimelineView,
} from '../../application/incident-timeline';
import {
  dedupeTimelineEntries,
  IncidentEventTimelineRow,
  IncidentEvidenceTimelineRow,
  IncidentNotificationTimelineRow,
  IncidentWorkOrderTimelineRow,
  sortTimelineEntries,
  toEventTimelineEntry,
  toEvidenceTimelineEntry,
  toNotificationTimelineEntry,
  toWorkOrderTimelineEntry,
} from '../../application/map-incident-timeline';

export class PostgresIncidentTimelineRepository
  implements IncidentTimelineRepository
{
  constructor(private readonly pool: Pool) {}

  async findTimelineByIncidentId(
    incidentId: string,
  ): Promise<IncidentTimelineView> {
    const [events, evidences, workOrders, notifications] = await Promise.all([
      this.loadEvents(incidentId),
      this.loadEventEvidences(incidentId),
      this.loadWorkOrders(incidentId),
      this.loadNotifications(incidentId),
    ]);

    const entries = dedupeTimelineEntries(
      sortTimelineEntries([
        ...events.map(toEventTimelineEntry),
        ...evidences.map(toEvidenceTimelineEntry),
        ...workOrders.map(toWorkOrderTimelineEntry),
        ...notifications.map(toNotificationTimelineEntry),
      ]),
    );

    return {
      incidentId,
      entries,
    };
  }

  private async loadEvents(
    incidentId: string,
  ): Promise<IncidentEventTimelineRow[]> {
    const result = await this.pool.query<IncidentEventTimelineRow>(
      `
        SELECT
          name,
          payload,
          actor_id,
          occurred_at
        FROM events
        WHERE incident_id = $1
        ORDER BY occurred_at ASC
      `,
      [incidentId],
    );

    return result.rows;
  }

  private async loadEventEvidences(
    incidentId: string,
  ): Promise<IncidentEvidenceTimelineRow[]> {
    const result = await this.pool.query<IncidentEvidenceTimelineRow>(
      `
        SELECT
          ee.evidence_id,
          e.actor_id,
          e.payload,
          e.occurred_at
        FROM event_evidences ee
        INNER JOIN events e ON e.id = ee.event_id
        WHERE e.incident_id = $1
        ORDER BY e.occurred_at ASC
      `,
      [incidentId],
    );

    return result.rows;
  }

  private async loadWorkOrders(
    incidentId: string,
  ): Promise<IncidentWorkOrderTimelineRow[]> {
    const result = await this.pool.query<IncidentWorkOrderTimelineRow>(
      `
        SELECT
          actor_id,
          description,
          created_at
        FROM work_orders
        WHERE incident_id = $1
        ORDER BY created_at ASC
      `,
      [incidentId],
    );

    return result.rows;
  }

  private async loadNotifications(
    incidentId: string,
  ): Promise<IncidentNotificationTimelineRow[]> {
    const result = await this.pool.query<IncidentNotificationTimelineRow>(
      `
        SELECT
          n.recipient_id,
          n.type,
          n.message,
          n.created_at
        FROM notifications n
        WHERE n.recipient_id IN (
          SELECT wo.actor_id
          FROM work_orders wo
          WHERE wo.incident_id = $1
          UNION
          SELECT e.actor_id
          FROM events e
          WHERE e.incident_id = $1
            AND e.actor_id IS NOT NULL
          UNION
          SELECT e.payload->>'actorId'
          FROM events e
          WHERE e.incident_id = $1
            AND e.payload->>'actorId' IS NOT NULL
        )
        OR (
          n.type = 'INCIDENT_DETECTED'
          AND EXISTS (
            SELECT 1
            FROM events e
            WHERE e.incident_id = $1
              AND e.name = 'workflow.flow.detected'
              AND n.created_at >= e.occurred_at
              AND n.created_at <= e.occurred_at + INTERVAL '60 seconds'
          )
        )
        ORDER BY n.created_at ASC
      `,
      [incidentId],
    );

    return result.rows;
  }
}
