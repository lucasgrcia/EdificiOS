import { IncidentAggregate, IncidentDomainEvent } from '../domain/incident';

export function pullExactlyOneDomainEvent(
  incident: IncidentAggregate,
): IncidentDomainEvent {
  const events = incident.pullDomainEvents();

  if (events.length !== 1) {
    throw new Error(
      `Expected exactly one domain event, received ${events.length}.`,
    );
  }

  return events[0];
}
