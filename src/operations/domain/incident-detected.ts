import { DomainEvent } from './domain-event';

export const INCIDENT_DETECTED_EVENT_NAME = 'workflow.flow.detected';

export class IncidentDetected implements DomainEvent {
  readonly name = INCIDENT_DETECTED_EVENT_NAME;

  constructor(
    readonly id: string,
    readonly incidentId: string,
    readonly description: string,
    readonly detectedAt: Date,
  ) {}

  get occurredAt(): Date {
    return new Date(this.detectedAt);
  }
}
