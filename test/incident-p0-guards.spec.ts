import { IncidentAggregate } from '../src/operations/domain/incident';
import { ActorId } from '../src/operations/domain/actor/value-objects/actor-id';
import { AssetId } from '../src/operations/domain/asset/value-objects/asset-id';
import { ShiftId } from '../src/operations/domain/shift/value-objects/shift-id';
import { pullExactlyOneDomainEvent } from '../src/operations/application/pull-exactly-one-domain-event';
import { PostgresIncidentRepository } from '../src/operations/infrastructure/persistence/postgres-incident-repository';

describe('pullExactlyOneDomainEvent', () => {
  it('returns the single domain event emitted by a transition', () => {
    const incident = IncidentAggregate.detect({
      incidentId: 'incident-1',
      flowId: 'event-1',
      assetId: AssetId.create('asset-1'),
      shiftId: ShiftId.create('shift-1'),
      actorId: ActorId.create('00000000-0000-0000-0000-000000000020'),
      description: 'Carlos detects a leak.',
      detectedAt: new Date('2026-07-07T15:00:00.000Z'),
    });

    const event = pullExactlyOneDomainEvent(incident);

    expect(event.name).toBe('workflow.flow.detected');
    expect(incident.pullDomainEvents()).toEqual([]);
  });

  it('fails when no domain events were emitted', () => {
    const incident = IncidentAggregate.rehydrate({
      incidentId: 'incident-1',
      assetId: AssetId.create('asset-1'),
      shiftId: ShiftId.create('shift-1'),
      actorId: ActorId.create('00000000-0000-0000-0000-000000000020'),
      description: 'Carlos detects a leak.',
      detectedAt: new Date('2026-07-07T15:00:00.000Z'),
      status: 'DETECTED',
    });

    expect(() => pullExactlyOneDomainEvent(incident)).toThrow(
      'Expected exactly one domain event, received 0.',
    );
  });

  it('fails when more than one domain event was emitted', () => {
    const incident = IncidentAggregate.detect({
      incidentId: 'incident-1',
      flowId: 'event-1',
      assetId: AssetId.create('asset-1'),
      shiftId: ShiftId.create('shift-1'),
      actorId: ActorId.create('00000000-0000-0000-0000-000000000020'),
      description: 'Carlos detects a leak.',
      detectedAt: new Date('2026-07-07T15:00:00.000Z'),
    });

    incident.assign({
      flowId: 'event-2',
      actorId: 'actor-1',
      assignedAt: new Date('2026-07-07T15:10:00.000Z'),
    });

    expect(() => pullExactlyOneDomainEvent(incident)).toThrow(
      'Expected exactly one domain event, received 2.',
    );
  });
});

describe('PostgresIncidentRepository updateProjection', () => {
  it('fails when no incident row is updated', async () => {
    const client = {
      query: jest.fn(async () => ({ rowCount: 0 })),
    };
    const repository = new PostgresIncidentRepository(client as never);

    await expect(
      repository.updateProjection({
        id: 'missing-incident',
        description: 'Carlos detects a leak.',
        currentProjectionState: {
          status: 'ASSIGNED',
          description: 'Carlos detects a leak.',
          detectedAt: '2026-07-07T15:00:00.000Z',
          assetId: 'asset-1',
          shiftId: 'shift-1',
          actorId: '00000000-0000-0000-0000-000000000020',
        },
        createdAt: new Date('2026-07-07T15:00:00.000Z'),
      }),
    ).rejects.toThrow('Incident projection was not updated.');
  });
});
