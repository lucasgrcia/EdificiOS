import { DomainEvent } from './domain-event';

export const INCIDENT_IN_PROGRESS_EVENT_NAME = 'workflow.flow.execution_started';

export class IncidentInProgress implements DomainEvent {
  readonly name = INCIDENT_IN_PROGRESS_EVENT_NAME;

  constructor(
    readonly id: string,
    readonly incidentId: string,
    readonly startedAt: Date,
  ) {}

  get occurredAt(): Date {
    return new Date(this.startedAt);
  }
}
