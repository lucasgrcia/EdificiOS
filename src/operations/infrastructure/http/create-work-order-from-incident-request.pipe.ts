import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

import { CreateWorkOrderFromIncidentRequestDto } from './create-work-order-from-incident.dto';

@Injectable()
export class CreateWorkOrderFromIncidentRequestPipe
  implements PipeTransform<unknown, CreateWorkOrderFromIncidentRequestDto>
{
  transform(value: unknown): CreateWorkOrderFromIncidentRequestDto {
    if (!this.isObject(value)) {
      throw new BadRequestException('Work order payload is required.');
    }

    return {
      description: this.readRequiredString(
        value,
        'description',
        'Work order description is required.',
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
