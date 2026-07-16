import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

import { LoginRequestDto } from './login.dto';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Injectable()
export class LoginRequestPipe
  implements PipeTransform<unknown, LoginRequestDto>
{
  transform(value: unknown): LoginRequestDto {
    if (!this.isObject(value)) {
      throw new BadRequestException('Login payload is required.');
    }

    this.ensureOnlyEmailField(value);

    return {
      email: this.readEmail(value),
    };
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private ensureOnlyEmailField(value: Record<string, unknown>): void {
    const keys = Object.keys(value);

    if (keys.length !== 1 || keys[0] !== 'email') {
      throw new BadRequestException('Only email is allowed.');
    }
  }

  private readEmail(value: Record<string, unknown>): string {
    if (!('email' in value) || typeof value.email !== 'string') {
      throw new BadRequestException('Email is required.');
    }

    const trimmed = value.email.trim();

    if (trimmed.length === 0) {
      throw new BadRequestException('Email is required.');
    }

    const normalized = trimmed.toLowerCase();

    if (!EMAIL_PATTERN.test(normalized)) {
      throw new BadRequestException('Email must be valid.');
    }

    return normalized;
  }
}
