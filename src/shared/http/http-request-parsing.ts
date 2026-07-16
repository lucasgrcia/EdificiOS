import { BadRequestException } from '@nestjs/common';

export function isHttpPayloadObject(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function readRequiredString(
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
