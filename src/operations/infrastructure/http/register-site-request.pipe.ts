import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import {
  isHttpPayloadObject,
  readRequiredString,
} from '../../../shared/http/http-request-parsing';
import { RegisterSiteRequestDto } from './register-site.dto';

@Injectable()
export class RegisterSiteRequestPipe
  implements PipeTransform<unknown, RegisterSiteRequestDto>
{
  transform(value: unknown): RegisterSiteRequestDto {
    if (!isHttpPayloadObject(value)) {
      throw new BadRequestException('Site payload is required.');
    }

    return {
      name: readRequiredString(value, 'name', 'Site name is required.'),
      address: readRequiredString(value, 'address', 'Address is required.'),
      timeZone: readRequiredString(
        value,
        'timeZone',
        'Time zone is required.',
      ),
      buildingType: readRequiredString(
        value,
        'buildingType',
        'Building type is required.',
      ),
    };
  }
}
