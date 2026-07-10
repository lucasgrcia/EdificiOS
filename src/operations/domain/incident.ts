import { AssetId } from './asset/value-objects/asset-id';
import { IncidentAssigned } from './incident-assigned';
import { IncidentDetected } from './incident-detected';
import { IncidentInProgress } from './incident-in-progress';
import { IncidentResolved } from './incident-resolved';

export type IncidentStatus =
  | 'DETECTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED';

export type IncidentDomainEvent =
  | IncidentDetected
  | IncidentAssigned
  | IncidentInProgress
  | IncidentResolved;

export type IncidentInput = {
  incidentId: string;
  flowId: string;
  assetId: AssetId;
  description: string;
  detectedAt: Date;
};

export type IncidentRehydrateInput = {
  incidentId: string;
  assetId: AssetId;
  description: string;
  detectedAt: Date;
  status: IncidentStatus;
};

export type AssignIncidentInput = {
  flowId: string;
  actorId: string;
  assignedAt: Date;
};

export type StartIncidentInput = {
  flowId: string;
  startedAt: Date;
};

export type ResolveIncidentInput = {
  flowId: string;
  resolvedAt: Date;
};

export class IncidentAggregate {
  private readonly domainEvents: IncidentDomainEvent[] = [];

  private constructor(
    private readonly incidentId: string,
    private readonly incidentDescription: string,
    private readonly incidentDetectedAt: Date,
    private status: IncidentStatus,
    private readonly incidentAssetId: AssetId | null,
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
      'DETECTED',
      input.assetId,
    );

    incident.recordFlowDetected(input.flowId);

    return incident;
  }

  static rehydrate(input: IncidentRehydrateInput): IncidentAggregate {
    if (input.incidentId.trim().length === 0) {
      throw new Error('Incident id is required.');
    }

    if (input.description.trim().length === 0) {
      throw new Error('Incident description is required.');
    }

    return new IncidentAggregate(
      input.incidentId,
      input.description,
      new Date(input.detectedAt),
      input.status,
      input.assetId,
    );
  }

  static replay(events: readonly IncidentDomainEvent[]): IncidentAggregate {
    if (events.length === 0) {
      throw new Error('At least one domain event is required for replay.');
    }

    const [first, ...remainingEvents] = events;

    if (!(first instanceof IncidentDetected)) {
      throw new Error('Replay must begin with IncidentDetected.');
    }

    const incident = new IncidentAggregate(
      first.incidentId,
      first.description,
      new Date(first.detectedAt),
      'DETECTED',
      null,
    );

    for (const event of remainingEvents) {
      incident.applyHistoricalEvent(event);
    }

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

  get currentStatus(): IncidentStatus {
    return this.status;
  }

  get assetId(): string | null {
    return this.incidentAssetId?.toString() ?? null;
  }

  assign(input: AssignIncidentInput): void {
    if (this.status !== 'DETECTED') {
      throw new Error('Incident can only be assigned from DETECTED status.');
    }

    if (input.flowId.trim().length === 0) {
      throw new Error('Flow id is required.');
    }

    if (input.actorId.trim().length === 0) {
      throw new Error('Actor id is required.');
    }

    this.status = 'ASSIGNED';
    this.recordFlowAssigned(input.flowId, input.actorId, input.assignedAt);
  }

  start(input: StartIncidentInput): void {
    if (this.status !== 'ASSIGNED') {
      throw new Error('Incident can only be started from ASSIGNED status.');
    }

    if (input.flowId.trim().length === 0) {
      throw new Error('Flow id is required.');
    }

    this.status = 'IN_PROGRESS';
    this.recordFlowExecutionStarted(input.flowId, input.startedAt);
  }

  resolve(input: ResolveIncidentInput): void {
    if (this.status !== 'IN_PROGRESS') {
      throw new Error('Incident can only be resolved from IN_PROGRESS status.');
    }

    if (input.flowId.trim().length === 0) {
      throw new Error('Flow id is required.');
    }

    this.status = 'RESOLVED';
    this.recordFlowResolved(input.flowId, input.resolvedAt);
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

  private recordFlowAssigned(
    flowId: string,
    actorId: string,
    assignedAt: Date,
  ): void {
    this.domainEvents.push(
      new IncidentAssigned(
        flowId,
        this.incidentId,
        actorId,
        new Date(assignedAt),
      ),
    );
  }

  private recordFlowExecutionStarted(flowId: string, startedAt: Date): void {
    this.domainEvents.push(
      new IncidentInProgress(flowId, this.incidentId, new Date(startedAt)),
    );
  }

  private recordFlowResolved(flowId: string, resolvedAt: Date): void {
    this.domainEvents.push(
      new IncidentResolved(flowId, this.incidentId, new Date(resolvedAt)),
    );
  }

  private applyHistoricalEvent(event: IncidentDomainEvent): void {
    if (event instanceof IncidentAssigned) {
      if (this.status !== 'DETECTED') {
        throw new Error(
          'Invalid replay sequence: assigned event requires DETECTED status.',
        );
      }

      this.status = 'ASSIGNED';
      return;
    }

    if (event instanceof IncidentInProgress) {
      if (this.status !== 'ASSIGNED') {
        throw new Error(
          'Invalid replay sequence: execution_started event requires ASSIGNED status.',
        );
      }

      this.status = 'IN_PROGRESS';
      return;
    }

    if (event instanceof IncidentResolved) {
      if (this.status !== 'IN_PROGRESS') {
        throw new Error(
          'Invalid replay sequence: resolved event requires IN_PROGRESS status.',
        );
      }

      this.status = 'RESOLVED';
      return;
    }

    throw new Error('Unsupported incident domain event for replay.');
  }
}
