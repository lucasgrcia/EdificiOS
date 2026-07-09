import { IncidentDetected } from './incident-detected';

export type IncidentDomainEvent = IncidentDetected;

export type IncidentInput = {
  incidentId: string;
  flowId: string;
  description: string;
  detectedAt: Date;
};

export class IncidentAggregate {
  private readonly domainEvents: IncidentDomainEvent[] = [];

  private constructor(
    private readonly incidentId: string,
    private readonly incidentDescription: string,
    private readonly incidentDetectedAt: Date,
  ) {}

  static detect(input: IncidentInput): IncidentAggregate {
    if (input.incidentId.trim().length === 0) {
      throw new Error('Incident id is required.');
    }

    if (input.flowId.trim().length === 0) {
      throw new Error('Flow id is required.');
    }

    if (input.description.trim().length === 0) {
      throw new Error('Incident description is required.');
    }

    const incident = new IncidentAggregate(
      input.incidentId,
      input.description,
      new Date(input.detectedAt),
    );

    incident.recordFlowDetected(input.flowId);

    return incident;
  }

  get id(): string {
    return this.incidentId;
  }

  get description(): string {
    return this.incidentDescription;
  }

  get detectedAt(): Date {
    return new Date(this.incidentDetectedAt);
  }

  pullDomainEvents(): IncidentDomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents.length = 0;
    return events;
  }

  private recordFlowDetected(flowId: string): void {
    this.domainEvents.push(
      new IncidentDetected(
        flowId,
        this.incidentId,
        this.incidentDescription,
        new Date(this.incidentDetectedAt),
      ),
    );
  }
}
