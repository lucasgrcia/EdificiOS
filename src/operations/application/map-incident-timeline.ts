import { INCIDENT_ASSIGNED_EVENT_NAME } from '../domain/incident-assigned';
import { INCIDENT_DETECTED_EVENT_NAME } from '../domain/incident-detected';
import { INCIDENT_IN_PROGRESS_EVENT_NAME } from '../domain/incident-in-progress';
import { INCIDENT_RESOLVED_EVENT_NAME } from '../domain/incident-resolved';
import { TimelineEntryView } from './incident-timeline';

export const EVIDENCE_ASSOCIATED_TIMELINE_TYPE = 'EVIDENCE_ASSOCIATED';
export const WORK_ORDER_CREATED_TIMELINE_TYPE = 'WORK_ORDER_CREATED';
export const NOTIFICATION_TIMELINE_TYPE = 'NOTIFICATION';

export type IncidentEventTimelineRow = {
  name: string;
  payload: {
    description?: string;
    actorId?: string;
  };
  actor_id: string | null;
  occurred_at: Date;
};

export type IncidentEvidenceTimelineRow = {
  evidence_id: string;
  actor_id: string | null;
  payload: {
    actorId?: string;
  };
  occurred_at: Date;
};

export type IncidentWorkOrderTimelineRow = {
  actor_id: string;
  description: string;
  created_at: Date;
};

export type IncidentNotificationTimelineRow = {
  recipient_id: string;
  type: string;
  message: string;
  created_at: Date;
};

export function toEventTimelineEntry(
  row: IncidentEventTimelineRow,
): TimelineEntryView {
  return {
    timestamp: row.occurred_at.toISOString(),
    type: row.name,
    description: resolveEventDescription(row),
    actorId: resolveEventActorId(row),
  };
}

export function toEvidenceTimelineEntry(
  row: IncidentEvidenceTimelineRow,
): TimelineEntryView {
  return {
    timestamp: row.occurred_at.toISOString(),
    type: EVIDENCE_ASSOCIATED_TIMELINE_TYPE,
    description: `Evidencia asociada (${row.evidence_id})`,
    actorId: resolveEvidenceActorId(row),
  };
}

export function toWorkOrderTimelineEntry(
  row: IncidentWorkOrderTimelineRow,
): TimelineEntryView {
  return {
    timestamp: row.created_at.toISOString(),
    type: WORK_ORDER_CREATED_TIMELINE_TYPE,
    description: row.description,
    actorId: row.actor_id,
  };
}

export function toNotificationTimelineEntry(
  row: IncidentNotificationTimelineRow,
): TimelineEntryView {
  return {
    timestamp: row.created_at.toISOString(),
    type: row.type,
    description: row.message,
    actorId: row.recipient_id,
  };
}

export function sortTimelineEntries(
  entries: TimelineEntryView[],
): TimelineEntryView[] {
  return [...entries].sort(
    (left, right) =>
      new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime(),
  );
}

export function dedupeTimelineEntries(
  entries: TimelineEntryView[],
): TimelineEntryView[] {
  const seen = new Set<string>();

  return entries.filter((entry) => {
    const key = [
      entry.timestamp,
      entry.type,
      entry.description,
      entry.actorId ?? '',
    ].join('|');

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function resolveEventDescription(row: IncidentEventTimelineRow): string {
  if (row.name === INCIDENT_DETECTED_EVENT_NAME) {
    return row.payload.description ?? 'Incidencia detectada.';
  }

  if (row.name === INCIDENT_ASSIGNED_EVENT_NAME) {
    return 'Incidencia asignada.';
  }

  if (row.name === INCIDENT_IN_PROGRESS_EVENT_NAME) {
    return 'Ejecución iniciada.';
  }

  if (row.name === INCIDENT_RESOLVED_EVENT_NAME) {
    return 'Incidencia resuelta.';
  }

  return row.name;
}

function resolveEventActorId(row: IncidentEventTimelineRow): string | null {
  if (row.actor_id !== null) {
    return row.actor_id;
  }

  if (row.payload.actorId !== undefined) {
    return row.payload.actorId;
  }

  return null;
}

function resolveEvidenceActorId(
  row: IncidentEvidenceTimelineRow,
): string | null {
  if (row.actor_id !== null) {
    return row.actor_id;
  }

  if (row.payload.actorId !== undefined) {
    return row.payload.actorId;
  }

  return null;
}
