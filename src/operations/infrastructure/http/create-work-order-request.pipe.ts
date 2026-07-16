import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import {
  isHttpPayloadObject,
  readRequiredString,
} from '../../../shared/http/http-request-parsing';
import { CreateWorkOrderRequestDto } from './create-work-order.dto';

@Injectable()
export class CreateWorkOrderRequestPipe
  implements PipeTransform<unknown, CreateWorkOrderRequestDto>
{
  transform(value: unknown): CreateWorkOrderRequestDto {
    if (!isHttpPayloadObject(value)) {
      throw new BadRequestException('Work order payload is required.');
    }

    return {
      incidentId: readRequiredString(
        value,
        'incidentId',
        'Incident id is required.',
      ),
      actorId: readRequiredString(value, 'actorId', 'Actor id is required.'),
      description: readRequiredString(
        value,
        'description',
        'Work order description is required.',
      ),
    };
  }
}
