import {
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';

import { ShiftResult } from '../../application/shift-result';
import { CloseShiftUseCase } from '../../application/close-shift-use-case';
import { ShiftNotFoundError } from '../../domain/shift/shift-not-found';

@Controller('api/v1/operations/shifts')
export class ShiftsController {
  constructor(private readonly closeShiftUseCase: CloseShiftUseCase) {}

  @Post(':shiftId/close')
  @HttpCode(HttpStatus.OK)
  async close(@Param('shiftId') shiftId: string): Promise<ShiftResult> {
    try {
      return await this.closeShiftUseCase.execute({ shiftId });
    } catch (error) {
      if (error instanceof ShiftNotFoundError) {
        throw new NotFoundException(error.message);
      }

      throw error;
    }
  }
}
