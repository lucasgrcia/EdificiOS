import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import {
  isHttpPayloadObject,
  readRequiredString,
} from '../../../shared/http/http-request-parsing';
import { DetectIncidentRequestDto } from './detect-incident.dto';

@Injectable()
export class DetectIncidentRequestPipe
  implements PipeTransform<unknown, DetectIncidentRequestDto>
{
  transform(value: unknown): DetectIncidentRequestDto {
    if (!isHttpPayloadObject(value)) {
      throw new BadRequestException('Incident payload is required.');
    }

    return {
      assetId: readRequiredString(value, 'assetId', 'Asset id is required.'),
      description: readRequiredString(
        value,
        'description',
        'Incident description is required.',
      ),
    };
  }
}
