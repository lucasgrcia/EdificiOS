import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

import { CreateWorkOrderRequestDto } from './create-work-order.dto';

@Injectable()
export class CreateWorkOrderRequestPipe
  implements PipeTransform<unknown, CreateWorkOrderRequestDto>
{
  transform(value: unknown): CreateWorkOrderRequestDto {
    if (!this.isObject(value)) {
      throw new BadRequestException('Work order payload is required.');
    }

    return {
      incidentId: this.readRequiredString(
        value,
        'incidentId',
        'Incident id is required.',
      ),
      actorId: this.readRequiredString(
        value,
        'actorId',
        'Actor id is required.',
      ),
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
