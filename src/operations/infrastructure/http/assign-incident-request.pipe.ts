import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

import { AssignIncidentRequestDto } from './assign-incident.dto';

@Injectable()
export class AssignIncidentRequestPipe
  implements PipeTransform<unknown, AssignIncidentRequestDto>
{
  transform(value: unknown): AssignIncidentRequestDto {
    if (!this.hasActorId(value)) {
      throw new BadRequestException('Actor id is required.');
    }

    return {
      actorId: value.actorId.trim(),
    };
  }

  private hasActorId(value: unknown): value is { actorId: string } {
    return (
      typeof value === 'object' &&
      value !== null &&
      'actorId' in value &&
      typeof value.actorId === 'string' &&
      value.actorId.trim().length > 0
    );
  }
}
