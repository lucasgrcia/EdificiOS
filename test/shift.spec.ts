import { ShiftAggregate } from '../src/operations/domain/shift/shift';
import { ShiftContinuityClosed } from '../src/operations/domain/shift/shift-continuity-closed';
import { ShiftContinuityStarted } from '../src/operations/domain/shift/shift-continuity-started';
import { EndedAt } from '../src/operations/domain/shift/value-objects/ended-at';
import { ShiftId } from '../src/operations/domain/shift/value-objects/shift-id';
import { ShiftStatus } from '../src/operations/domain/shift/value-objects/shift-status';
import { ShiftType } from '../src/operations/domain/shift/value-objects/shift-type';
import { SiteId } from '../src/operations/domain/shift/value-objects/site-id';
import { StartedAt } from '../src/operations/domain/shift/value-objects/started-at';

describe('Shift value objects', () => {
  describe('ShiftId', () => {
    it('creates a valid shift id', () => {
      expect(ShiftId.create(' shift-1 ').toString()).toBe('shift-1');
    });

    it('rejects an empty shift id', () => {
      expect(() => ShiftId.create('   ')).toThrow('Shift id is required.');
    });
  });

  describe('SiteId', () => {
    it('creates a valid site id', () => {
      expect(SiteId.create(' site-1 ').toString()).toBe('site-1');
    });

    it('rejects an empty site id', () => {
      expect(() => SiteId.create('')).toThrow('Site id is required.');
    });
  });

  describe('ShiftType', () => {
    it('creates a valid shift type', () => {
      expect(ShiftType.create(' Mañana ').toString()).toBe('Mañana');
    });

    it('rejects an empty shift type', () => {
      expect(() => ShiftType.create('  ')).toThrow('Shift type is required.');
    });
  });

  describe('ShiftStatus', () => {
    it.each(['OPEN', 'CLOSED'])('accepts supported status %s', (status) => {
      expect(ShiftStatus.create(status).toString()).toBe(status);
    });

    it('normalizes status casing', () => {
      expect(ShiftStatus.create(' open ').toString()).toBe('OPEN');
    });

    it('rejects unsupported status', () => {
      expect(() => ShiftStatus.create('PENDING')).toThrow(
        'Shift status is not supported.',
      );
    });
  });

  describe('StartedAt', () => {
    it('creates a valid started at timestamp', () => {
      const startedAt = new Date('2026-07-10T08:00:00.000Z');

      expect(StartedAt.create(startedAt).toDate()).toEqual(startedAt);
    });

    it('rejects an invalid started at timestamp', () => {
      expect(() => StartedAt.create(new Date('invalid'))).toThrow(
        'Started at is required.',
      );
    });
  });

  describe('EndedAt', () => {
    const startedAt = StartedAt.create(new Date('2026-07-10T08:00:00.000Z'));

    it('creates a valid ended at timestamp', () => {
      const endedAt = new Date('2026-07-10T16:00:00.000Z');

      expect(EndedAt.create(endedAt, startedAt).toDate()).toEqual(endedAt);
    });

    it('rejects an invalid ended at timestamp', () => {
      expect(() => EndedAt.create(new Date('invalid'), startedAt)).toThrow(
        'Ended at is required.',
      );
    });

    it('rejects ended at before started at', () => {
      expect(() =>
        EndedAt.create(new Date('2026-07-10T07:00:00.000Z'), startedAt),
      ).toThrow('Ended at cannot precede started at.');
    });
  });
});

describe('ShiftAggregate', () => {
  const startedAt = new Date('2026-07-10T08:00:00.000Z');
  const endedAt = new Date('2026-07-10T16:00:00.000Z');
  const actorId = '00000000-0000-0000-0000-000000000020';
  const validInput = {
    shiftId: 'shift-1',
    flowId: 'flow-started-1',
    siteId: 'site-1',
    actorId,
    shiftType: 'Mañana',
    startedAt,
  };

  it('starts a valid shift in OPEN status', () => {
    const shift = ShiftAggregate.start(validInput);

    expect(shift.id).toBe('shift-1');
    expect(shift.siteId).toBe('site-1');
    expect(shift.actorId).toBe(actorId);
    expect(shift.shiftType).toBe('Mañana');
    expect(shift.startedAt).toEqual(startedAt);
    expect(shift.endedAt).toBeNull();
    expect(shift.currentStatus).toBe('OPEN');
  });

  it('emits shift.continuity.started when a shift starts', () => {
    const shift = ShiftAggregate.start(validInput);
    const events = shift.pullDomainEvents();

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(ShiftContinuityStarted);
    expect(events[0].name).toBe('shift.continuity.started');
    expect(events[0]).toMatchObject({
      id: 'flow-started-1',
      shiftId: 'shift-1',
      siteId: 'site-1',
      actorId,
      shiftType: 'Mañana',
      startedAt,
    });
  });

  it('closes an open shift and records ended at', () => {
    const shift = ShiftAggregate.start({
      ...validInput,
      flowId: 'flow-started-1',
    });
    shift.pullDomainEvents();

    shift.close({
      flowId: 'flow-closed-1',
      endedAt,
    });

    expect(shift.currentStatus).toBe('CLOSED');
    expect(shift.endedAt).toEqual(endedAt);
  });

  it('emits shift.continuity.closed when a shift closes', () => {
    const shift = ShiftAggregate.start(validInput);
    shift.pullDomainEvents();

    shift.close({
      flowId: 'flow-closed-1',
      endedAt,
    });

    const events = shift.pullDomainEvents();

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(ShiftContinuityClosed);
    expect(events[0].name).toBe('shift.continuity.closed');
    expect(events[0]).toMatchObject({
      id: 'flow-closed-1',
      shiftId: 'shift-1',
      endedAt,
    });
  });

  it('rejects closing a shift that is already closed', () => {
    const shift = ShiftAggregate.start(validInput);
    shift.pullDomainEvents();
    shift.close({ flowId: 'flow-closed-1', endedAt });

    expect(() =>
      shift.close({ flowId: 'flow-closed-2', endedAt }),
    ).toThrow('Shift is already closed.');
  });

  it('rehydrates an open shift without ended at', () => {
    const started = ShiftAggregate.start(validInput);
    const rehydrated = ShiftAggregate.rehydrate({
      shiftId: started.id,
      siteId: started.siteId,
      actorId: started.actorId,
      shiftType: started.shiftType,
      status: 'OPEN',
      startedAt: started.startedAt,
      endedAt: null,
    });

    expect(rehydrated.currentStatus).toBe('OPEN');
    expect(rehydrated.endedAt).toBeNull();
    expect(rehydrated.id).toBe(started.id);
    expect(rehydrated.siteId).toBe(started.siteId);
    expect(rehydrated.actorId).toBe(started.actorId);
    expect(rehydrated.shiftType).toBe(started.shiftType);
    expect(rehydrated.startedAt).toEqual(started.startedAt);
  });

  it('rehydrates a closed shift with ended at', () => {
    const started = ShiftAggregate.start(validInput);
    started.close({ flowId: 'flow-closed-1', endedAt });

    const rehydrated = ShiftAggregate.rehydrate({
      shiftId: started.id,
      siteId: started.siteId,
      actorId: started.actorId,
      shiftType: started.shiftType,
      status: 'CLOSED',
      startedAt: started.startedAt,
      endedAt: started.endedAt,
    });

    expect(rehydrated.currentStatus).toBe('CLOSED');
    expect(rehydrated.endedAt).toEqual(endedAt);
  });

  it('rejects rehydrating an open shift with ended at', () => {
    expect(() =>
      ShiftAggregate.rehydrate({
        ...validInput,
        status: 'OPEN',
        endedAt,
      }),
    ).toThrow('Open shift cannot have ended at.');
  });

  it('rejects rehydrating a closed shift without ended at', () => {
    expect(() =>
      ShiftAggregate.rehydrate({
        ...validInput,
        status: 'CLOSED',
        endedAt: null,
      }),
    ).toThrow('Closed shift requires ended at.');
  });

  it('rejects start without flow id', () => {
    expect(() =>
      ShiftAggregate.start({
        ...validInput,
        flowId: '   ',
      }),
    ).toThrow('Flow id is required.');
  });

  it('rejects start without shift id', () => {
    expect(() =>
      ShiftAggregate.start({
        ...validInput,
        shiftId: '',
      }),
    ).toThrow('Shift id is required.');
  });

  it('rejects start without site id', () => {
    expect(() =>
      ShiftAggregate.start({
        ...validInput,
        siteId: '   ',
      }),
    ).toThrow('Site id is required.');
  });

  it('rejects start without actor id', () => {
    expect(() =>
      ShiftAggregate.start({
        ...validInput,
        actorId: '',
      }),
    ).toThrow('Actor id is required.');
  });

  it('rejects start without shift type', () => {
    expect(() =>
      ShiftAggregate.start({
        ...validInput,
        shiftType: '  ',
      }),
    ).toThrow('Shift type is required.');
  });

  it('rejects start without started at', () => {
    expect(() =>
      ShiftAggregate.start({
        ...validInput,
        startedAt: new Date('invalid'),
      }),
    ).toThrow('Started at is required.');
  });

  it('rejects close without flow id', () => {
    const shift = ShiftAggregate.start(validInput);

    expect(() =>
      shift.close({
        flowId: '   ',
        endedAt,
      }),
    ).toThrow('Flow id is required.');
  });

  it('rejects close with ended at before started at', () => {
    const shift = ShiftAggregate.start(validInput);

    expect(() =>
      shift.close({
        flowId: 'flow-closed-1',
        endedAt: new Date('2026-07-10T07:00:00.000Z'),
      }),
    ).toThrow('Ended at cannot precede started at.');
  });

  it('clears domain events after pullDomainEvents', () => {
    const shift = ShiftAggregate.start(validInput);

    expect(shift.pullDomainEvents()).toHaveLength(1);
    expect(shift.pullDomainEvents()).toEqual([]);
  });
});

describe('ShiftAggregate replay', () => {
  const startedAt = new Date('2026-07-10T08:00:00.000Z');
  const endedAt = new Date('2026-07-10T16:00:00.000Z');
  const actorId = '00000000-0000-0000-0000-000000000020';

  it('reconstructs OPEN status from a single started event', () => {
    const events = [
      new ShiftContinuityStarted(
        'flow-started-1',
        'shift-1',
        'site-1',
        actorId,
        'Mañana',
        startedAt,
      ),
    ];

    const shift = ShiftAggregate.replay(events);

    expect(shift.id).toBe('shift-1');
    expect(shift.siteId).toBe('site-1');
    expect(shift.actorId).toBe(actorId);
    expect(shift.shiftType).toBe('Mañana');
    expect(shift.startedAt).toEqual(startedAt);
    expect(shift.endedAt).toBeNull();
    expect(shift.currentStatus).toBe('OPEN');
    expect(shift.pullDomainEvents()).toEqual([]);
  });

  it('reconstructs CLOSED status from chronological domain events', () => {
    const events = [
      new ShiftContinuityStarted(
        'flow-started-1',
        'shift-1',
        'site-1',
        actorId,
        'Tarde',
        startedAt,
      ),
      new ShiftContinuityClosed('flow-closed-1', 'shift-1', endedAt),
    ];

    const shift = ShiftAggregate.replay(events);

    expect(shift.currentStatus).toBe('CLOSED');
    expect(shift.endedAt).toEqual(endedAt);
    expect(shift.pullDomainEvents()).toEqual([]);
  });

  it('rejects replay without events', () => {
    expect(() => ShiftAggregate.replay([])).toThrow(
      'At least one domain event is required for replay.',
    );
  });

  it('rejects replay that does not begin with ShiftContinuityStarted', () => {
    expect(() =>
      ShiftAggregate.replay([
        new ShiftContinuityClosed('flow-closed-1', 'shift-1', endedAt),
      ]),
    ).toThrow('Replay must begin with ShiftContinuityStarted.');
  });

  it('rejects replay with duplicate closed events', () => {
    const events = [
      new ShiftContinuityStarted(
        'flow-started-1',
        'shift-1',
        'site-1',
        actorId,
        'Noche',
        startedAt,
      ),
      new ShiftContinuityClosed('flow-closed-1', 'shift-1', endedAt),
      new ShiftContinuityClosed('flow-closed-2', 'shift-1', endedAt),
    ];

    expect(() => ShiftAggregate.replay(events)).toThrow(
      'Invalid replay sequence: closed event requires OPEN status.',
    );
  });
});
