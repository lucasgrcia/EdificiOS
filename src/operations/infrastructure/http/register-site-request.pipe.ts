import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

import { RegisterSiteRequestDto } from './register-site.dto';

@Injectable()
export class RegisterSiteRequestPipe
  implements PipeTransform<unknown, RegisterSiteRequestDto>
{
  transform(value: unknown): RegisterSiteRequestDto {
    if (!this.isObject(value)) {
      throw new BadRequestException('Site payload is required.');
    }

    return {
      name: this.readRequiredString(value, 'name', 'Site name is required.'),
      address: this.readRequiredString(value, 'address', 'Address is required.'),
      timeZone: this.readRequiredString(
        value,
        'timeZone',
        'Time zone is required.',
      ),
      buildingType: this.readRequiredString(
        value,
        'buildingType',
        'Building type is required.',
      ),
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
