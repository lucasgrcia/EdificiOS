import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

import { CreateUserRequestDto } from './create-user.dto';

@Injectable()
export class CreateUserRequestPipe
  implements PipeTransform<unknown, CreateUserRequestDto>
{
  transform(value: unknown): CreateUserRequestDto {
    if (!this.isObject(value)) {
      throw new BadRequestException('User payload is required.');
    }

    return {
      email: this.readEmail(value),
      displayName: this.readDisplayName(value),
    };
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private readEmail(value: Record<string, unknown>): string {
    if (!('email' in value) || typeof value.email !== 'string') {
      throw new BadRequestException('Email is required.');
    }

    const trimmed = value.email.trim();

    if (trimmed.length === 0) {
      throw new BadRequestException('Email is required.');
    }

    return trimmed.toLowerCase();
  }

  private readDisplayName(value: Record<string, unknown>): string {
    if (!('displayName' in value) || typeof value.displayName !== 'string') {
      throw new BadRequestException('Display name is required.');
    }

    const trimmed = value.displayName.trim();

    if (trimmed.length === 0) {
      throw new BadRequestException('Display name is required.');
    }

    return trimmed;
  }
}
