import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

import { StartShiftRequestDto } from './start-shift.dto';

@Injectable()
export class StartShiftRequestPipe
  implements PipeTransform<unknown, StartShiftRequestDto>
{
  transform(value: unknown): StartShiftRequestDto {
    if (!this.isObject(value)) {
      throw new BadRequestException('Shift payload is required.');
    }

    const actorId = this.readRequiredString(
      value,
      'actorId',
      'Actor id is required.',
    );
    const shiftType = this.readRequiredString(
      value,
      'shiftType',
      'Shift type is required.',
    );

    return {
      actorId,
      shiftType,
    };
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private readRequiredString(
    value: Record<string, unknown>,
    field: string,
    message: string,
  ): string {
    if (!(field in value) || typeof value[field] !== 'string') {
      throw new BadRequestException(message);
    }

    const trimmed = value[field].trim();

    if (trimmed.length === 0) {
      throw new BadRequestException(message);
    }

    return trimmed;
  }
}
