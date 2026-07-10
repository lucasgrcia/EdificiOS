import { AssignIncidentUseCase } from '../src/operations/application/assign-incident-use-case';
import { AssetRecord } from '../src/operations/application/asset-persistence';
import { DetectIncidentUseCase } from '../src/operations/application/detect-incident-use-case';
import { ShiftRecord } from '../src/operations/application/shift-persistence';
import {
  FlowEventRecord,
  IncidentRecord,
  OutboxRecord,
  Transaction,
  TransactionRunner,
} from '../src/operations/application/incident-persistence';
import { ResolveIncidentUseCase } from '../src/operations/application/resolve-incident-use-case';
import { StartIncidentUseCase } from '../src/operations/application/start-incident-use-case';

type WriteEntry = {
  kind: 'Incident' | 'Projection' | 'Event' | 'Outbox';
  transactionId: string;
  record: IncidentRecord | FlowEventRecord | OutboxRecord;
};

const ASSET_ID = 'asset-1';
const SHIFT_ID = 'shift-1';
const assetRecord: AssetRecord = {
  id: ASSET_ID,
  siteId: 'site-1',
  name: 'Bomba principal',
  type: 'Bomba',
  manufacturer: null,
  model: null,
  serialNumber: null,
  location: 'Subsuelo',
  criticality: 'HIGH',
};
const activeShift: ShiftRecord = {
  id: SHIFT_ID,
  siteId: 'site-1',
  actorId: '00000000-0000-0000-0000-000000000020',
  type: 'Mañana',
  status: 'OPEN',
  startedAt: new Date('2026-07-10T08:00:00.000Z'),
  endedAt: null,
};

function createInMemoryTransaction(
  transactionId: string,
  writes: WriteEntry[],
  incidents: Map<string, IncidentRecord>,
): Transaction {
  return {
    incidents: {
      save: async (record) => {
        incidents.set(record.id, structuredClone(record));
        writes.push({ kind: 'Incident', transactionId, record });
      },
      findById: async (id) => {
        const record = incidents.get(id);
        return record === undefined ? null : structuredClone(record);
      },
      updateProjection: async (record) => {
        incidents.set(record.id, structuredClone(record));
        writes.push({ kind: 'Projection', transactionId, record });
      },
    },
    events: {
      save: async (record) => {
        writes.push({ kind: 'Event', transactionId, record });
      },
    },
    outbox: {
      save: async (record) => {
        writes.push({ kind: 'Outbox', transactionId, record });
      },
    },
  };
}

function createTestHarness() {
  const writes: WriteEntry[] = [];
  const incidents = new Map<string, IncidentRecord>();
  let transactionCounter = 0;
  const ids: string[] = [];
  const timestamps = [
    '2026-07-07T15:00:00.000Z',
    '2026-07-07T15:10:00.000Z',
    '2026-07-07T15:20:00.000Z',
    '2026-07-07T15:30:00.000Z',
    '2026-07-07T15:40:00.000Z',
    '2026-07-07T15:50:00.000Z',
    '2026-07-07T16:00:00.000Z',
    '2026-07-07T16:10:00.000Z',
    '2026-07-07T16:20:00.000Z',
    '2026-07-07T16:30:00.000Z',
    '2026-07-07T16:40:00.000Z',
    '2026-07-07T16:50:00.000Z',
  ];
  let timestampIndex = 0;

  const transactionRunner: TransactionRunner = {
    run: async (work) => {
      transactionCounter += 1;
      const transactionId = `tx-${transactionCounter}`;
      return work(createInMemoryTransaction(transactionId, writes, incidents));
    },
  };

  const dependencies = {
    transactionRunner,
    idGenerator: {
      generate: () => {
        const id = ids.shift();

        if (id === undefined) {
          throw new Error('No id available.');
        }

        return id;
      },
    },
    clock: {
      now: () => {
        const timestamp = timestamps[timestampIndex];
        timestampIndex += 1;

        if (timestamp === undefined) {
          throw new Error('No timestamp available.');
        }

        return new Date(timestamp);
      },
    },
    assetRepository: {
      findById: async (id: string) => (id === ASSET_ID ? assetRecord : null),
      findBySite: async () => [],
      save: async () => {
        throw new Error('Not expected.');
      },
    },
    shiftRepository: {
      findById: async () => null,
      findActiveBySite: async (recordSiteId: string) =>
        recordSiteId === 'site-1' ? [activeShift] : [],
      save: async () => {
        throw new Error('Not expected.');
      },
      update: async () => {
        throw new Error('Not expected.');
      },
    },
  };

  return {
    writes,
    incidents,
    dependencies,
    pushIds: (...nextIds: string[]) => {
      ids.push(...nextIds);
    },
  };
}

describe('Incident lifecycle integration', () => {
  it('persists the full DETECTED → ASSIGNED → IN_PROGRESS → RESOLVED flow', async () => {
    const harness = createTestHarness();
    harness.pushIds(
      'incident-1',
      'event-detected',
      'outbox-detected',
      'event-assigned',
      'outbox-assigned',
      'event-started',
      'outbox-started',
      'event-resolved',
      'outbox-resolved',
    );

    const detectUseCase = new DetectIncidentUseCase(harness.dependencies);
    const assignUseCase = new AssignIncidentUseCase(harness.dependencies);
    const startUseCase = new StartIncidentUseCase(harness.dependencies);
    const resolveUseCase = new ResolveIncidentUseCase(harness.dependencies);

    const detected = await detectUseCase.execute({
      assetId: ASSET_ID,
      description: 'Carlos detects a leak.',
    });
    const assigned = await assignUseCase.execute({
      incidentId: 'incident-1',
      actorId: 'actor-1',
    });
    const started = await startUseCase.execute({ incidentId: 'incident-1' });
    const resolved = await resolveUseCase.execute({ incidentId: 'incident-1' });

    expect(detected).toEqual({
      incidentId: 'incident-1',
      eventId: 'event-detected',
      outboxId: 'outbox-detected',
    });
    expect(assigned).toEqual({
      incidentId: 'incident-1',
      eventId: 'event-assigned',
      outboxId: 'outbox-assigned',
    });
    expect(started).toEqual({
      incidentId: 'incident-1',
      eventId: 'event-started',
      outboxId: 'outbox-started',
    });
    expect(resolved).toEqual({
      incidentId: 'incident-1',
      eventId: 'event-resolved',
      outboxId: 'outbox-resolved',
    });

    expect(harness.writes.map((write) => write.kind)).toEqual([
      'Incident',
      'Event',
      'Outbox',
      'Projection',
      'Event',
      'Outbox',
      'Projection',
      'Event',
      'Outbox',
      'Projection',
      'Event',
      'Outbox',
    ]);

    expect(harness.incidents.get('incident-1')?.currentProjectionState).toEqual({
      status: 'RESOLVED',
      description: 'Carlos detects a leak.',
      detectedAt: '2026-07-07T15:00:00.000Z',
      assetId: ASSET_ID,
      shiftId: SHIFT_ID,
      actorId: activeShift.actorId,
      assignedAt: '2026-07-07T15:10:00.000Z',
      assignedActorId: 'actor-1',
      startedAt: '2026-07-07T15:20:00.000Z',
      resolvedAt: '2026-07-07T15:30:00.000Z',
    });

    const eventNames = harness.writes
      .filter((write) => write.kind === 'Event')
      .map((write) => (write.record as FlowEventRecord).name);

    expect(eventNames).toEqual([
      'workflow.flow.detected',
      'workflow.flow.assigned',
      'workflow.flow.execution_started',
      'workflow.flow.resolved',
    ]);
  });

  it('persists assign transition in a single transaction', async () => {
    const harness = createTestHarness();
    harness.pushIds('incident-1', 'event-detected', 'outbox-detected');
    const detectUseCase = new DetectIncidentUseCase(harness.dependencies);
    await detectUseCase.execute({
      assetId: ASSET_ID,
      description: 'Carlos detects a leak.',
    });

    harness.pushIds('event-assigned', 'outbox-assigned');
    const assignUseCase = new AssignIncidentUseCase(harness.dependencies);
    const writesBeforeAssign = harness.writes.length;

    await assignUseCase.execute({
      incidentId: 'incident-1',
      actorId: 'actor-1',
    });

    const assignWrites = harness.writes.slice(writesBeforeAssign);
    expect(assignWrites.map((write) => write.kind)).toEqual([
      'Projection',
      'Event',
      'Outbox',
    ]);
    expect(new Set(assignWrites.map((write) => write.transactionId))).toEqual(
      new Set(['tx-2']),
    );
    expect(assignWrites[1].record).toMatchObject({
      id: 'event-assigned',
      name: 'workflow.flow.assigned',
      actorId: 'actor-1',
      payload: {
        incidentId: 'incident-1',
        actorId: 'actor-1',
        assignedAt: '2026-07-07T15:10:00.000Z',
      },
    });
  });

  it('persists start transition in a single transaction', async () => {
    const harness = createTestHarness();
    harness.pushIds(
      'incident-1',
      'event-detected',
      'outbox-detected',
      'event-assigned',
      'outbox-assigned',
    );
    const detectUseCase = new DetectIncidentUseCase(harness.dependencies);
    const assignUseCase = new AssignIncidentUseCase(harness.dependencies);
    await detectUseCase.execute({
      assetId: ASSET_ID,
      description: 'Carlos detects a leak.',
    });
    await assignUseCase.execute({
      incidentId: 'incident-1',
      actorId: 'actor-1',
    });

    harness.pushIds('event-started', 'outbox-started');
    const startUseCase = new StartIncidentUseCase(harness.dependencies);
    const writesBeforeStart = harness.writes.length;

    await startUseCase.execute({ incidentId: 'incident-1' });

    const startWrites = harness.writes.slice(writesBeforeStart);
    expect(startWrites.map((write) => write.kind)).toEqual([
      'Projection',
      'Event',
      'Outbox',
    ]);
    expect(startWrites[1].record).toMatchObject({
      id: 'event-started',
      name: 'workflow.flow.execution_started',
      payload: {
        incidentId: 'incident-1',
        startedAt: '2026-07-07T15:20:00.000Z',
      },
    });
  });

  it('persists resolve transition in a single transaction', async () => {
    const harness = createTestHarness();
    harness.pushIds(
      'incident-1',
      'event-detected',
      'outbox-detected',
      'event-assigned',
      'outbox-assigned',
      'event-started',
      'outbox-started',
    );
    const detectUseCase = new DetectIncidentUseCase(harness.dependencies);
    const assignUseCase = new AssignIncidentUseCase(harness.dependencies);
    const startUseCase = new StartIncidentUseCase(harness.dependencies);
    await detectUseCase.execute({
      assetId: ASSET_ID,
      description: 'Carlos detects a leak.',
    });
    await assignUseCase.execute({
      incidentId: 'incident-1',
      actorId: 'actor-1',
    });
    await startUseCase.execute({ incidentId: 'incident-1' });

    harness.pushIds('event-resolved', 'outbox-resolved');
    const resolveUseCase = new ResolveIncidentUseCase(harness.dependencies);
    const writesBeforeResolve = harness.writes.length;

    await resolveUseCase.execute({ incidentId: 'incident-1' });

    const resolveWrites = harness.writes.slice(writesBeforeResolve);
    expect(resolveWrites.map((write) => write.kind)).toEqual([
      'Projection',
      'Event',
      'Outbox',
    ]);
    expect(resolveWrites[1].record).toMatchObject({
      id: 'event-resolved',
      name: 'workflow.flow.resolved',
      payload: {
        incidentId: 'incident-1',
        resolvedAt: '2026-07-07T15:30:00.000Z',
      },
    });
  });
});

describe('Incident lifecycle invalid transitions', () => {
  it('rejects assign when incident is not found', async () => {
    const harness = createTestHarness();
    harness.pushIds('event-assigned', 'outbox-assigned');
    const assignUseCase = new AssignIncidentUseCase(harness.dependencies);

    await expect(
      assignUseCase.execute({
        incidentId: 'missing-incident',
        actorId: 'actor-1',
      }),
    ).rejects.toThrow('Incident not found.');

    expect(harness.writes).toEqual([]);
  });

  it('rejects assign when incident is already ASSIGNED', async () => {
    const harness = createTestHarness();
    harness.pushIds(
      'incident-1',
      'event-detected',
      'outbox-detected',
      'event-assigned',
      'outbox-assigned',
    );
    const detectUseCase = new DetectIncidentUseCase(harness.dependencies);
    const assignUseCase = new AssignIncidentUseCase(harness.dependencies);
    await detectUseCase.execute({
      assetId: ASSET_ID,
      description: 'Carlos detects a leak.',
    });
    await assignUseCase.execute({
      incidentId: 'incident-1',
      actorId: 'actor-1',
    });

    harness.pushIds('event-assigned-2', 'outbox-assigned-2');

    await expect(
      assignUseCase.execute({
        incidentId: 'incident-1',
        actorId: 'actor-2',
      }),
    ).rejects.toThrow('Incident can only be assigned from DETECTED status.');

    expect(harness.writes.filter((write) => write.kind === 'Event')).toHaveLength(
      2,
    );
  });

  it('rejects assign when incident is IN_PROGRESS', async () => {
    const harness = createTestHarness();
    harness.pushIds(
      'incident-1',
      'event-detected',
      'outbox-detected',
      'event-assigned',
      'outbox-assigned',
      'event-started',
      'outbox-started',
    );
    const detectUseCase = new DetectIncidentUseCase(harness.dependencies);
    const assignUseCase = new AssignIncidentUseCase(harness.dependencies);
    const startUseCase = new StartIncidentUseCase(harness.dependencies);
    await detectUseCase.execute({
      assetId: ASSET_ID,
      description: 'Carlos detects a leak.',
    });
    await assignUseCase.execute({
      incidentId: 'incident-1',
      actorId: 'actor-1',
    });
    await startUseCase.execute({ incidentId: 'incident-1' });

    harness.pushIds('event-assigned-2', 'outbox-assigned-2');

    await expect(
      assignUseCase.execute({
        incidentId: 'incident-1',
        actorId: 'actor-2',
      }),
    ).rejects.toThrow('Incident can only be assigned from DETECTED status.');
  });

  it('rejects assign when incident is RESOLVED', async () => {
    const harness = createTestHarness();
    harness.pushIds(
      'incident-1',
      'event-detected',
      'outbox-detected',
      'event-assigned',
      'outbox-assigned',
      'event-started',
      'outbox-started',
      'event-resolved',
      'outbox-resolved',
    );
    const detectUseCase = new DetectIncidentUseCase(harness.dependencies);
    const assignUseCase = new AssignIncidentUseCase(harness.dependencies);
    const startUseCase = new StartIncidentUseCase(harness.dependencies);
    const resolveUseCase = new ResolveIncidentUseCase(harness.dependencies);
    await detectUseCase.execute({
      assetId: ASSET_ID,
      description: 'Carlos detects a leak.',
    });
    await assignUseCase.execute({
      incidentId: 'incident-1',
      actorId: 'actor-1',
    });
    await startUseCase.execute({ incidentId: 'incident-1' });
    await resolveUseCase.execute({ incidentId: 'incident-1' });

    harness.pushIds('event-assigned-2', 'outbox-assigned-2');

    await expect(
      assignUseCase.execute({
        incidentId: 'incident-1',
        actorId: 'actor-2',
      }),
    ).rejects.toThrow('Incident can only be assigned from DETECTED status.');
  });

  it('rejects start when incident is not found', async () => {
    const harness = createTestHarness();
    harness.pushIds('event-started', 'outbox-started');
    const startUseCase = new StartIncidentUseCase(harness.dependencies);

    await expect(
      startUseCase.execute({ incidentId: 'missing-incident' }),
    ).rejects.toThrow('Incident not found.');
  });

  it('rejects start when incident is DETECTED', async () => {
    const harness = createTestHarness();
    harness.pushIds('incident-1', 'event-detected', 'outbox-detected');
    const detectUseCase = new DetectIncidentUseCase(harness.dependencies);
    const startUseCase = new StartIncidentUseCase(harness.dependencies);
    await detectUseCase.execute({
      assetId: ASSET_ID,
      description: 'Carlos detects a leak.',
    });

    harness.pushIds('event-started', 'outbox-started');

    await expect(
      startUseCase.execute({ incidentId: 'incident-1' }),
    ).rejects.toThrow('Incident can only be started from ASSIGNED status.');
  });

  it('rejects start when incident is IN_PROGRESS', async () => {
    const harness = createTestHarness();
    harness.pushIds(
      'incident-1',
      'event-detected',
      'outbox-detected',
      'event-assigned',
      'outbox-assigned',
      'event-started',
      'outbox-started',
    );
    const detectUseCase = new DetectIncidentUseCase(harness.dependencies);
    const assignUseCase = new AssignIncidentUseCase(harness.dependencies);
    const startUseCase = new StartIncidentUseCase(harness.dependencies);
    await detectUseCase.execute({
      assetId: ASSET_ID,
      description: 'Carlos detects a leak.',
    });
    await assignUseCase.execute({
      incidentId: 'incident-1',
      actorId: 'actor-1',
    });
    await startUseCase.execute({ incidentId: 'incident-1' });

    harness.pushIds('event-started-2', 'outbox-started-2');

    await expect(
      startUseCase.execute({ incidentId: 'incident-1' }),
    ).rejects.toThrow('Incident can only be started from ASSIGNED status.');
  });

  it('rejects start when incident is RESOLVED', async () => {
    const harness = createTestHarness();
    harness.pushIds(
      'incident-1',
      'event-detected',
      'outbox-detected',
      'event-assigned',
      'outbox-assigned',
      'event-started',
      'outbox-started',
      'event-resolved',
      'outbox-resolved',
    );
    const detectUseCase = new DetectIncidentUseCase(harness.dependencies);
    const assignUseCase = new AssignIncidentUseCase(harness.dependencies);
    const startUseCase = new StartIncidentUseCase(harness.dependencies);
    const resolveUseCase = new ResolveIncidentUseCase(harness.dependencies);
    await detectUseCase.execute({
      assetId: ASSET_ID,
      description: 'Carlos detects a leak.',
    });
    await assignUseCase.execute({
      incidentId: 'incident-1',
      actorId: 'actor-1',
    });
    await startUseCase.execute({ incidentId: 'incident-1' });
    await resolveUseCase.execute({ incidentId: 'incident-1' });

    harness.pushIds('event-started-2', 'outbox-started-2');

    await expect(
      startUseCase.execute({ incidentId: 'incident-1' }),
    ).rejects.toThrow('Incident can only be started from ASSIGNED status.');
  });

  it('rejects resolve when incident is not found', async () => {
    const harness = createTestHarness();
    harness.pushIds('event-resolved', 'outbox-resolved');
    const resolveUseCase = new ResolveIncidentUseCase(harness.dependencies);

    await expect(
      resolveUseCase.execute({ incidentId: 'missing-incident' }),
    ).rejects.toThrow('Incident not found.');
  });

  it('rejects resolve when incident is DETECTED', async () => {
    const harness = createTestHarness();
    harness.pushIds('incident-1', 'event-detected', 'outbox-detected');
    const detectUseCase = new DetectIncidentUseCase(harness.dependencies);
    const resolveUseCase = new ResolveIncidentUseCase(harness.dependencies);
    await detectUseCase.execute({
      assetId: ASSET_ID,
      description: 'Carlos detects a leak.',
    });

    harness.pushIds('event-resolved', 'outbox-resolved');

    await expect(
      resolveUseCase.execute({ incidentId: 'incident-1' }),
    ).rejects.toThrow('Incident can only be resolved from IN_PROGRESS status.');
  });

  it('rejects resolve when incident is ASSIGNED', async () => {
    const harness = createTestHarness();
    harness.pushIds(
      'incident-1',
      'event-detected',
      'outbox-detected',
      'event-assigned',
      'outbox-assigned',
    );
    const detectUseCase = new DetectIncidentUseCase(harness.dependencies);
    const assignUseCase = new AssignIncidentUseCase(harness.dependencies);
    const resolveUseCase = new ResolveIncidentUseCase(harness.dependencies);
    await detectUseCase.execute({
      assetId: ASSET_ID,
      description: 'Carlos detects a leak.',
    });
    await assignUseCase.execute({
      incidentId: 'incident-1',
      actorId: 'actor-1',
    });

    harness.pushIds('event-resolved', 'outbox-resolved');

    await expect(
      resolveUseCase.execute({ incidentId: 'incident-1' }),
    ).rejects.toThrow('Incident can only be resolved from IN_PROGRESS status.');
  });

  it('rejects resolve when incident is already RESOLVED', async () => {
    const harness = createTestHarness();
    harness.pushIds(
      'incident-1',
      'event-detected',
      'outbox-detected',
      'event-assigned',
      'outbox-assigned',
      'event-started',
      'outbox-started',
      'event-resolved',
      'outbox-resolved',
    );
    const detectUseCase = new DetectIncidentUseCase(harness.dependencies);
    const assignUseCase = new AssignIncidentUseCase(harness.dependencies);
    const startUseCase = new StartIncidentUseCase(harness.dependencies);
    const resolveUseCase = new ResolveIncidentUseCase(harness.dependencies);
    await detectUseCase.execute({
      assetId: ASSET_ID,
      description: 'Carlos detects a leak.',
    });
    await assignUseCase.execute({
      incidentId: 'incident-1',
      actorId: 'actor-1',
    });
    await startUseCase.execute({ incidentId: 'incident-1' });
    await resolveUseCase.execute({ incidentId: 'incident-1' });

    harness.pushIds('event-resolved-2', 'outbox-resolved-2');

    await expect(
      resolveUseCase.execute({ incidentId: 'incident-1' }),
    ).rejects.toThrow('Incident can only be resolved from IN_PROGRESS status.');
  });
});
