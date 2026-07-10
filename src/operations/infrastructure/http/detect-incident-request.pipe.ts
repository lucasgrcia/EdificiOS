import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

import { DetectIncidentRequestDto } from './detect-incident.dto';

@Injectable()
export class DetectIncidentRequestPipe
  implements PipeTransform<unknown, DetectIncidentRequestDto>
{
  transform(value: unknown): DetectIncidentRequestDto {
    if (!this.isObject(value)) {
      throw new BadRequestException('Incident payload is required.');
    }

    const assetId = this.readRequiredString(value, 'assetId', 'Asset id is required.');
    const description = this.readRequiredString(
      value,
      'description',
      'Incident description is required.',
    );

    return {
      assetId,
      description,
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
