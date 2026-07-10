import { ActorAggregate } from '../src/operations/domain/actor/actor';
import { ActorId } from '../src/operations/domain/actor/value-objects/actor-id';
import { ActorName } from '../src/operations/domain/actor/value-objects/actor-name';
import { ActorRole } from '../src/operations/domain/actor/value-objects/actor-role';
import { ActorStatus } from '../src/operations/domain/actor/value-objects/actor-status';

describe('Actor value objects', () => {
  const actorUuid = '00000000-0000-0000-0000-000000000001';

  describe('ActorId', () => {
    it('creates a valid actor id from a UUID', () => {
      expect(
        ActorId.create(` ${actorUuid.toUpperCase()} `).toString(),
      ).toBe(actorUuid);
    });

    it('rejects an empty actor id', () => {
      expect(() => ActorId.create('   ')).toThrow('Actor id is required.');
    });

    it('rejects an invalid actor id', () => {
      expect(() => ActorId.create('actor-1')).toThrow(
        'Actor id must be a valid UUID.',
      );
    });
  });

  describe('ActorName', () => {
    it('creates a valid actor name', () => {
      expect(ActorName.create(' Juan Pérez ').toString()).toBe('Juan Pérez');
    });

    it('rejects an empty actor name', () => {
      expect(() => ActorName.create('')).toThrow('Actor name is required.');
    });
  });

  describe('ActorRole', () => {
    it.each(['PORTER', 'ADMINISTRATOR', 'SECURITY', 'TECHNICIAN'])(
      'accepts supported actor role %s',
      (role) => {
        expect(ActorRole.create(role).toString()).toBe(role);
      },
    );

    it('normalizes actor role casing', () => {
      expect(ActorRole.create(' porter ').toString()).toBe('PORTER');
    });

    it('rejects an empty actor role', () => {
      expect(() => ActorRole.create('   ')).toThrow('Actor role is required.');
    });

    it('rejects unsupported actor role', () => {
      expect(() => ActorRole.create('MANAGER')).toThrow(
        'Actor role is not supported.',
      );
    });
  });

  describe('ActorStatus', () => {
    it.each(['ACTIVE', 'INACTIVE'])(
      'accepts supported actor status %s',
      (status) => {
        expect(ActorStatus.create(status).toString()).toBe(status);
      },
    );

    it('normalizes actor status casing', () => {
      expect(ActorStatus.create(' active ').toString()).toBe('ACTIVE');
    });

    it('rejects an empty actor status', () => {
      expect(() => ActorStatus.create('   ')).toThrow(
        'Actor status is required.',
      );
    });

    it('rejects unsupported actor status', () => {
      expect(() => ActorStatus.create('SUSPENDED')).toThrow(
        'Actor status is not supported.',
      );
    });
  });
});

describe('ActorAggregate', () => {
  const validInput = {
    actorId: '00000000-0000-0000-0000-000000000001',
    name: 'Juan Pérez',
    role: 'PORTER',
    status: 'ACTIVE',
  };

  it('registers a valid actor with all attributes', () => {
    const actor = ActorAggregate.register(validInput);

    expect(actor.id).toBe('00000000-0000-0000-0000-000000000001');
    expect(actor.name).toBe('Juan Pérez');
    expect(actor.role).toBe('PORTER');
    expect(actor.status).toBe('ACTIVE');
  });

  it('rehydrates a previously registered actor', () => {
    const registered = ActorAggregate.register(validInput);
    const rehydrated = ActorAggregate.rehydrate({
      actorId: registered.id,
      name: registered.name,
      role: registered.role,
      status: registered.status,
    });

    expect(rehydrated.id).toBe(registered.id);
    expect(rehydrated.name).toBe(registered.name);
    expect(rehydrated.role).toBe(registered.role);
    expect(rehydrated.status).toBe(registered.status);
  });

  it('rejects registration without actor id', () => {
    expect(() =>
      ActorAggregate.register({
        ...validInput,
        actorId: '',
      }),
    ).toThrow('Actor id is required.');
  });

  it('rejects registration with invalid actor id', () => {
    expect(() =>
      ActorAggregate.register({
        ...validInput,
        actorId: 'invalid-id',
      }),
    ).toThrow('Actor id must be a valid UUID.');
  });

  it('rejects registration without actor name', () => {
    expect(() =>
      ActorAggregate.register({
        ...validInput,
        name: '   ',
      }),
    ).toThrow('Actor name is required.');
  });

  it('rejects registration without actor role', () => {
    expect(() =>
      ActorAggregate.register({
        ...validInput,
        role: '',
      }),
    ).toThrow('Actor role is required.');
  });

  it('rejects registration with unsupported actor role', () => {
    expect(() =>
      ActorAggregate.register({
        ...validInput,
        role: 'MANAGER',
      }),
    ).toThrow('Actor role is not supported.');
  });

  it('rejects registration without actor status', () => {
    expect(() =>
      ActorAggregate.register({
        ...validInput,
        status: '  ',
      }),
    ).toThrow('Actor status is required.');
  });

  it('rejects registration with unsupported actor status', () => {
    expect(() =>
      ActorAggregate.register({
        ...validInput,
        status: 'SUSPENDED',
      }),
    ).toThrow('Actor status is not supported.');
  });

  it('rejects rehydration without actor id', () => {
    expect(() =>
      ActorAggregate.rehydrate({
        ...validInput,
        actorId: '',
      }),
    ).toThrow('Actor id is required.');
  });
});
