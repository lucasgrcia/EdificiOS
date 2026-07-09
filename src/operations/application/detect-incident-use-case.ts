import { IncidentAggregate } from '../domain/incident';
import {
  INCIDENT_DETECTED_EVENT_NAME,
  IncidentDetected,
} from '../domain/incident-detected';

export type DetectIncidentCommand = {
  description: string;
};

export type IncidentRecord = {
  id: string;
  description: string;
  currentProjectionState: {
    description: string;
    detectedAt: string;
  };
  createdAt: Date;
};

export type FlowEventRecord = {
  id: string;
  aggregateType: 'Incident';
  aggregateId: string;
  incidentId: string;
  name: typeof INCIDENT_DETECTED_EVENT_NAME;
  schemaVersion: 1;
  correlationId: string | null;
  causationId: string | null;
  actorId: string | null;
  payload: {
    incidentId: string;
    description: string;
    detectedAt: string;
  };
  occurredAt: Date;
};

export type OutboxRecord = {
  id: string;
  aggregateType: 'Incident';
  aggregateId: string;
  eventId: string;
  payload: FlowEventRecord;
  status: 'pending';
  createdAt: Date;
};

export type DetectIncidentResult = {
  incidentId: string;
  eventId: string;
  outboxId: string;
};

export interface IncidentRepository {
  save(incident: IncidentRecord): Promise<void>;
}

export interface FlowEventRepository {
  save(event: FlowEventRecord): Promise<void>;
}

export interface OutboxRepository {
  save(outbox: OutboxRecord): Promise<void>;
}

export interface Transaction {
  incidents: IncidentRepository;
  events: FlowEventRepository;
  outbox: OutboxRepository;
}

export interface TransactionRunner {
  run<T>(work: (transaction: Transaction) => Promise<T>): Promise<T>;
}

export interface IdGenerator {
  generate(): string;
}

export interface Clock {
  now(): Date;
}

export type DetectIncidentUseCaseDependencies = {
  transactionRunner: TransactionRunner;
  idGenerator: IdGenerator;
  clock: Clock;
};

export class DetectIncidentUseCase {
  constructor(private readonly dependencies: DetectIncidentUseCaseDependencies) {}

  async execute(command: DetectIncidentCommand): Promise<DetectIncidentResult> {
    return this.dependencies.transactionRunner.run(async (transaction) => {
      const incidentId = this.dependencies.idGenerator.generate();
      const eventId = this.dependencies.idGenerator.generate();
      const outboxId = this.dependencies.idGenerator.generate();
      const detectedAt = this.dependencies.clock.now();

      const incident = IncidentAggregate.detect({
        incidentId,
        flowId: eventId,
        description: command.description,
        detectedAt,
      });
      const [event] = incident.pullDomainEvents();
      const flow = this.toFlowEventRecord(event);

      const outbox: OutboxRecord = {
        id: outboxId,
        aggregateType: flow.aggregateType,
        aggregateId: flow.aggregateId,
        eventId: flow.id,
        payload: flow,
        status: 'pending',
        createdAt: incident.detectedAt,
      };

      await transaction.incidents.save({
        id: incident.id,
        description: incident.description,
        currentProjectionState: {
          description: incident.description,
          detectedAt: incident.detectedAt.toISOString(),
        },
        createdAt: incident.detectedAt,
      });
      await transaction.events.save(flow);
      await transaction.outbox.save(outbox);

      return {
        incidentId,
        eventId,
        outboxId,
      };
    });
  }

  private toFlowEventRecord(event: IncidentDetected): FlowEventRecord {
    return {
      id: event.id,
      aggregateType: 'Incident',
      aggregateId: event.incidentId,
      incidentId: event.incidentId,
      name: event.name,
      schemaVersion: 1,
      correlationId: null,
      causationId: null,
      actorId: null,
      payload: {
        incidentId: event.incidentId,
        description: event.description,
        detectedAt: event.detectedAt.toISOString(),
      },
      occurredAt: event.occurredAt,
    };
  }
}
