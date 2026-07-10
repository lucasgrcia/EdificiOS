import { ActiveShiftAlreadyExistsError } from '../src/operations/domain/shift/active-shift-already-exists';
import { MultipleActiveShiftsError } from '../src/operations/domain/shift/multiple-active-shifts';
import { ShiftNotFoundError } from '../src/operations/domain/shift/shift-not-found';
import { CloseShiftUseCase } from '../src/operations/application/close-shift-use-case';
import { GetActiveShiftUseCase } from '../src/operations/application/get-active-shift-use-case';
import { ShiftRecord } from '../src/operations/application/shift-persistence';
import { StartShiftUseCase } from '../src/operations/application/start-shift-use-case';

describe('Shift use cases integration', () => {
  const siteId = 'site-1';
  const operatorId = 'operator-1';
  const startedAt = new Date('2026-07-10T08:00:00.000Z');
  const endedAt = new Date('2026-07-10T16:00:00.000Z');

  function createShiftRepository() {
    const shifts = new Map<string, ShiftRecord>();

    return {
      save: jest.fn(async (record: ShiftRecord) => {
        shifts.set(record.id, structuredClone(record));
      }),
      findById: jest.fn(async (id: string) => {
        const record = shifts.get(id);
        return record === undefined ? null : structuredClone(record);
      }),
      findActiveBySite: jest.fn(async (recordSiteId: string) => {
        return [...shifts.values()]
          .filter(
            (record) =>
              record.siteId === recordSiteId && record.status === 'OPEN',
          )
          .map((record) => structuredClone(record));
      }),
      update: jest.fn(async (record: ShiftRecord) => {
        if (!shifts.has(record.id)) {
          throw new Error('Shift was not updated.');
        }

        shifts.set(record.id, structuredClone(record));
      }),
      shifts,
    };
  }

  function createDependencies(
    shiftRepository: ReturnType<typeof createShiftRepository>,
    options?: {
      ids?: string[];
      timestamps?: Date[];
    },
  ) {
    const ids = [...(options?.ids ?? ['shift-1', 'flow-started-1'])];
    const timestamps = [
      ...(options?.timestamps ?? [startedAt, endedAt]),
    ];
    let timestampIndex = 0;

    return {
      shiftRepository,
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

          return timestamp;
        },
      },
    };
  }

  describe('StartShiftUseCase', () => {
    it('starts a shift when no active shift exists for the site', async () => {
      const shiftRepository = createShiftRepository();
      const useCase = new StartShiftUseCase(createDependencies(shiftRepository));

      const result = await useCase.execute({
        siteId,
        operatorId,
        shiftType: 'Mañana',
      });

      expect(result).toEqual({
        id: 'shift-1',
        siteId,
        operatorId,
        type: 'Mañana',
        status: 'OPEN',
        startedAt,
        endedAt: null,
      });
      expect(shiftRepository.save).toHaveBeenCalledTimes(1);
      expect(shiftRepository.save).toHaveBeenCalledWith({
        id: 'shift-1',
        siteId,
        operatorId,
        type: 'Mañana',
        status: 'OPEN',
        startedAt,
        endedAt: null,
      });
    });

    it('rejects starting a shift when the site already has an active shift', async () => {
      const shiftRepository = createShiftRepository();
      shiftRepository.shifts.set('existing-shift', {
        id: 'existing-shift',
        siteId,
        operatorId: 'operator-0',
        type: 'Noche',
        status: 'OPEN',
        startedAt,
        endedAt: null,
      });
      const useCase = new StartShiftUseCase(createDependencies(shiftRepository));

      await expect(
        useCase.execute({
          siteId,
          operatorId,
          shiftType: 'Mañana',
        }),
      ).rejects.toBeInstanceOf(ActiveShiftAlreadyExistsError);

      expect(shiftRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('CloseShiftUseCase', () => {
    it('closes an open shift through the aggregate close() intent', async () => {
      const shiftRepository = createShiftRepository();
      shiftRepository.shifts.set('shift-1', {
        id: 'shift-1',
        siteId,
        operatorId,
        type: 'Mañana',
        status: 'OPEN',
        startedAt,
        endedAt: null,
      });
      const useCase = new CloseShiftUseCase(
        createDependencies(shiftRepository, {
          ids: ['flow-closed-1'],
          timestamps: [endedAt],
        }),
      );

      const result = await useCase.execute({ shiftId: 'shift-1' });

      expect(result).toEqual({
        id: 'shift-1',
        siteId,
        operatorId,
        type: 'Mañana',
        status: 'CLOSED',
        startedAt,
        endedAt,
      });
      expect(shiftRepository.update).toHaveBeenCalledTimes(1);
      expect(shiftRepository.update).toHaveBeenCalledWith({
        id: 'shift-1',
        siteId,
        operatorId,
        type: 'Mañana',
        status: 'CLOSED',
        startedAt,
        endedAt,
      });
    });

    it('rejects closing a shift that does not exist', async () => {
      const shiftRepository = createShiftRepository();
      const useCase = new CloseShiftUseCase(createDependencies(shiftRepository));

      await expect(
        useCase.execute({ shiftId: 'missing-shift' }),
      ).rejects.toBeInstanceOf(ShiftNotFoundError);

      expect(shiftRepository.update).not.toHaveBeenCalled();
    });

    it('rejects closing a shift that is already closed', async () => {
      const shiftRepository = createShiftRepository();
      shiftRepository.shifts.set('shift-1', {
        id: 'shift-1',
        siteId,
        operatorId,
        type: 'Mañana',
        status: 'CLOSED',
        startedAt,
        endedAt,
      });
      const useCase = new CloseShiftUseCase(createDependencies(shiftRepository));

      await expect(
        useCase.execute({ shiftId: 'shift-1' }),
      ).rejects.toThrow('Shift is already closed.');

      expect(shiftRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('GetActiveShiftUseCase', () => {
    it('returns the active shift for a site', async () => {
      const shiftRepository = createShiftRepository();
      shiftRepository.shifts.set('shift-1', {
        id: 'shift-1',
        siteId,
        operatorId,
        type: 'Tarde',
        status: 'OPEN',
        startedAt,
        endedAt: null,
      });
      const useCase = new GetActiveShiftUseCase({
        shiftRepository,
      });

      const result = await useCase.execute({ siteId });

      expect(result).toEqual({
        id: 'shift-1',
        siteId,
        operatorId,
        type: 'Tarde',
        status: 'OPEN',
        startedAt,
        endedAt: null,
      });
    });

    it('returns null when the site has no active shift', async () => {
      const shiftRepository = createShiftRepository();
      shiftRepository.shifts.set('shift-1', {
        id: 'shift-1',
        siteId,
        operatorId,
        type: 'Mañana',
        status: 'CLOSED',
        startedAt,
        endedAt,
      });
      const useCase = new GetActiveShiftUseCase({
        shiftRepository,
      });

      const result = await useCase.execute({ siteId });

      expect(result).toBeNull();
    });

    it('rejects when multiple active shifts exist for the same site', async () => {
      const shiftRepository = createShiftRepository();
      shiftRepository.shifts.set('shift-1', {
        id: 'shift-1',
        siteId,
        operatorId,
        type: 'Mañana',
        status: 'OPEN',
        startedAt,
        endedAt: null,
      });
      shiftRepository.shifts.set('shift-2', {
        id: 'shift-2',
        siteId,
        operatorId: 'operator-2',
        type: 'Tarde',
        status: 'OPEN',
        startedAt: new Date('2026-07-10T14:00:00.000Z'),
        endedAt: null,
      });
      const useCase = new GetActiveShiftUseCase({
        shiftRepository,
      });

      await expect(useCase.execute({ siteId })).rejects.toBeInstanceOf(
        MultipleActiveShiftsError,
      );
    });
  });

  describe('Shift continuity flow', () => {
    it('supports start, query active shift, and close in sequence', async () => {
      const shiftRepository = createShiftRepository();
      const dependencies = createDependencies(shiftRepository, {
        ids: ['shift-1', 'flow-started-1', 'flow-closed-1'],
        timestamps: [startedAt, endedAt],
      });
      const startUseCase = new StartShiftUseCase(dependencies);
      const getActiveUseCase = new GetActiveShiftUseCase({
        shiftRepository,
      });
      const closeUseCase = new CloseShiftUseCase(dependencies);

      const started = await startUseCase.execute({
        siteId,
        operatorId,
        shiftType: 'Mañana',
      });
      const active = await getActiveUseCase.execute({ siteId });
      const closed = await closeUseCase.execute({ shiftId: started.id });
      const afterClose = await getActiveUseCase.execute({ siteId });

      expect(active).toEqual(started);
      expect(closed.status).toBe('CLOSED');
      expect(closed.endedAt).toEqual(endedAt);
      expect(afterClose).toBeNull();
    });
  });
});
