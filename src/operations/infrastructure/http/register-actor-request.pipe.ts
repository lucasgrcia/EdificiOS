import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import {
  isHttpPayloadObject,
  readRequiredString,
} from '../../../shared/http/http-request-parsing';
import { RegisterActorRequestDto } from './register-actor.dto';

const ALLOWED_ACTOR_ROLES = [
  'PORTER',
  'ADMINISTRATOR',
  'SECURITY',
  'TECHNICIAN',
] as const;

const ALLOWED_ACTOR_STATUSES = ['ACTIVE', 'INACTIVE'] as const;

@Injectable()
export class RegisterActorRequestPipe
  implements PipeTransform<unknown, RegisterActorRequestDto>
{
  transform(value: unknown): RegisterActorRequestDto {
    if (!isHttpPayloadObject(value)) {
      throw new BadRequestException('Actor payload is required.');
    }

    return {
      siteId: readRequiredString(value, 'siteId', 'Site id is required.'),
      name: readRequiredString(value, 'name', 'Actor name is required.'),
      role: this.readRole(value),
      status: this.readStatus(value),
    };
  }

  private readRole(value: Record<string, unknown>): string {
    if (!('role' in value) || typeof value.role !== 'string') {
      throw new BadRequestException('Actor role is required.');
    }

    const normalized = value.role.trim().toUpperCase();

    if (normalized.length === 0) {
      throw new BadRequestException('Actor role is required.');
    }

    if (
      !ALLOWED_ACTOR_ROLES.includes(
        normalized as (typeof ALLOWED_ACTOR_ROLES)[number],
      )
    ) {
      throw new BadRequestException('Actor role is not supported.');
    }

    return normalized;
  }

  private readStatus(value: Record<string, unknown>): string {
    if (!('status' in value) || typeof value.status !== 'string') {
      throw new BadRequestException('Actor status is required.');
    }

    const normalized = value.status.trim().toUpperCase();

    if (normalized.length === 0) {
      throw new BadRequestException('Actor status is required.');
    }

    if (
      !ALLOWED_ACTOR_STATUSES.includes(
        normalized as (typeof ALLOWED_ACTOR_STATUSES)[number],
      )
    ) {
      throw new BadRequestException('Actor status is not supported.');
    }

    return normalized;
  }
}
