import { MultipleActiveShiftsError } from '../domain/shift/multiple-active-shifts';
import { toShiftResult } from './map-shift';
import { ShiftRepository } from './shift-persistence';
import { ShiftResult } from './shift-result';

export type GetActiveShiftCommand = {
  siteId: string;
};

export type GetActiveShiftUseCaseDependencies = {
  shiftRepository: ShiftRepository;
};

export class GetActiveShiftUseCase {
  constructor(
    private readonly dependencies: GetActiveShiftUseCaseDependencies,
  ) {}

  async execute(command: GetActiveShiftCommand): Promise<ShiftResult | null> {
    const activeShifts = await this.dependencies.shiftRepository.findActiveBySite(
      command.siteId,
    );

    if (activeShifts.length === 0) {
      return null;
    }

    if (activeShifts.length > 1) {
      throw new MultipleActiveShiftsError(command.siteId);
    }

    return toShiftResult(activeShifts[0]);
  }
}
