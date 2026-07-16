import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import {
  isHttpPayloadObject,
  readRequiredString,
} from '../../../shared/http/http-request-parsing';
import { StartShiftRequestDto } from './start-shift.dto';

@Injectable()
export class StartShiftRequestPipe
  implements PipeTransform<unknown, StartShiftRequestDto>
{
  transform(value: unknown): StartShiftRequestDto {
    if (!isHttpPayloadObject(value)) {
      throw new BadRequestException('Shift payload is required.');
    }

    return {
      actorId: readRequiredString(value, 'actorId', 'Actor id is required.'),
      shiftType: readRequiredString(
        value,
        'shiftType',
        'Shift type is required.',
      ),
    };
  }
}
