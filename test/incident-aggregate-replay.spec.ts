import { IncidentAggregate } from '../src/operations/domain/incident';
import { IncidentAssigned } from '../src/operations/domain/incident-assigned';
import { IncidentDetected } from '../src/operations/domain/incident-detected';
import { IncidentInProgress } from '../src/operations/domain/incident-in-progress';
import { IncidentResolved } from '../src/operations/domain/incident-resolved';

describe('IncidentAggregate replay', () => {
  it('reconstructs RESOLVED status from chronological domain events', () => {
    const incidentId = 'incident-1';
    const description = 'Carlos detects a leak.';
    const detectedAt = new Date('2026-07-07T15:00:00.000Z');
    const assignedAt = new Date('2026-07-07T15:10:00.000Z');
    const startedAt = new Date('2026-07-07T15:20:00.000Z');
    const resolvedAt = new Date('2026-07-07T15:30:00.000Z');

    const events = [
      new IncidentDetected(
        'event-detected',
        incidentId,
        description,
        detectedAt,
      ),
      new IncidentAssigned(
        'event-assigned',
        incidentId,
        'actor-1',
        assignedAt,
      ),
      new IncidentInProgress('event-started', incidentId, startedAt),
      new IncidentResolved('event-resolved', incidentId, resolvedAt),
    ];

    const incident = IncidentAggregate.replay(events);

    expect(incident.id).toBe(incidentId);
    expect(incident.description).toBe(description);
    expect(incident.detectedAt).toEqual(detectedAt);
    expect(incident.currentStatus).toBe('RESOLVED');
    expect(incident.pullDomainEvents()).toEqual([]);
  });
});
