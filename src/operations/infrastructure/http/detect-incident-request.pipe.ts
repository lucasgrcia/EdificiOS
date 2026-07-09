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
    if (!this.hasDescription(value)) {
      throw new BadRequestException('Incident description is required.');
    }

    return {
      description: value.description.trim(),
    };
  }

  private hasDescription(value: unknown): value is { description: string } {
    return (
      typeof value === 'object' &&
      value !== null &&
      'description' in value &&
      typeof value.description === 'string' &&
      value.description.trim().length > 0
    );
  }
}
