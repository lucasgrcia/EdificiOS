import { DomainEvent } from './domain-event';

export const INCIDENT_ASSIGNED_EVENT_NAME = 'workflow.flow.assigned';

export class IncidentAssigned implements DomainEvent {
  readonly name = INCIDENT_ASSIGNED_EVENT_NAME;

  constructor(
    readonly id: string,
    readonly incidentId: string,
    readonly actorId: string,
    readonly assignedAt: Date,
  ) {}

  get occurredAt(): Date {
    return new Date(this.assignedAt);
  }
}
