export interface DomainEvent {
  readonly id: string;
  readonly name: string;
  readonly occurredAt: Date;
}
