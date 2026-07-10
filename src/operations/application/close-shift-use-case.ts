import { ShiftNotFoundError } from '../domain/shift/shift-not-found';
import { Clock, IdGenerator } from './incident-persistence';
import { rehydrateShift, toShiftRecord, toShiftResult } from './map-shift';
import { ShiftRepository } from './shift-persistence';
import { ShiftResult } from './shift-result';

export type CloseShiftCommand = {
  shiftId: string;
};

export type CloseShiftUseCaseDependencies = {
  shiftRepository: ShiftRepository;
  idGenerator: IdGenerator;
  clock: Clock;
};

export class CloseShiftUseCase {
  constructor(private readonly dependencies: CloseShiftUseCaseDependencies) {}

  async execute(command: CloseShiftCommand): Promise<ShiftResult> {
    const record = await this.dependencies.shiftRepository.findById(
      command.shiftId,
    );

    if (record === null) {
      throw new ShiftNotFoundError(command.shiftId);
    }

    const shift = rehydrateShift(record);
    const flowId = this.dependencies.idGenerator.generate();
    const endedAt = this.dependencies.clock.now();

    shift.close({
      flowId,
      endedAt,
    });

    shift.pullDomainEvents();

    const updatedRecord = toShiftRecord(shift);
    await this.dependencies.shiftRepository.update(updatedRecord);

    return toShiftResult(updatedRecord);
  }
}
