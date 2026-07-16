import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import {
  isHttpPayloadObject,
  readRequiredString,
} from '../../../shared/http/http-request-parsing';
import { CreateWorkOrderFromIncidentRequestDto } from './create-work-order-from-incident.dto';

@Injectable()
export class CreateWorkOrderFromIncidentRequestPipe
  implements PipeTransform<unknown, CreateWorkOrderFromIncidentRequestDto>
{
  transform(value: unknown): CreateWorkOrderFromIncidentRequestDto {
    if (!isHttpPayloadObject(value)) {
      throw new BadRequestException('Work order payload is required.');
    }

    return {
      description: readRequiredString(
        value,
        'description',
        'Work order description is required.',
      ),
    };
  }
}
