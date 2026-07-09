import { DomainEvent } from './domain-event';

export const INCIDENT_RESOLVED_EVENT_NAME = 'workflow.flow.resolved';

export class IncidentResolved implements DomainEvent {
  readonly name = INCIDENT_RESOLVED_EVENT_NAME;

  constructor(
    readonly id: string,
    readonly incidentId: string,
    readonly resolvedAt: Date,
  ) {}

  get occurredAt(): Date {
    return new Date(this.resolvedAt);
  }
}
