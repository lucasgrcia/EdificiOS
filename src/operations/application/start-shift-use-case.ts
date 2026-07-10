import { ActiveShiftAlreadyExistsError } from '../domain/shift/active-shift-already-exists';
import { ShiftAggregate } from '../domain/shift/shift';
import { Clock, IdGenerator } from './incident-persistence';
import { toShiftRecord, toShiftResult } from './map-shift';
import { ShiftRepository } from './shift-persistence';
import { ShiftResult } from './shift-result';

export type StartShiftCommand = {
  siteId: string;
  operatorId: string;
  shiftType: string;
};

export type StartShiftUseCaseDependencies = {
  shiftRepository: ShiftRepository;
  idGenerator: IdGenerator;
  clock: Clock;
};

export class StartShiftUseCase {
  constructor(private readonly dependencies: StartShiftUseCaseDependencies) {}

  async execute(command: StartShiftCommand): Promise<ShiftResult> {
    const activeShifts = await this.dependencies.shiftRepository.findActiveBySite(
      command.siteId,
    );

    if (activeShifts.length > 0) {
      throw new ActiveShiftAlreadyExistsError(command.siteId);
    }

    const shiftId = this.dependencies.idGenerator.generate();
    const flowId = this.dependencies.idGenerator.generate();
    const startedAt = this.dependencies.clock.now();

    const shift = ShiftAggregate.start({
      shiftId,
      flowId,
      siteId: command.siteId,
      operatorId: command.operatorId,
      shiftType: command.shiftType,
      startedAt,
    });

    shift.pullDomainEvents();

    const record = toShiftRecord(shift);
    await this.dependencies.shiftRepository.save(record);

    return toShiftResult(record);
  }
}
