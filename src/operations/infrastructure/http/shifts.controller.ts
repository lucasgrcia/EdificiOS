import {
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthenticationGuard } from '../../../authentication/infrastructure/http/jwt-authentication.guard';
import { ShiftResult } from '../../application/shift-result';
import { CloseShiftUseCase } from '../../application/close-shift-use-case';
import { ShiftNotFoundError } from '../../domain/shift/shift-not-found';

@UseGuards(JwtAuthenticationGuard)
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
