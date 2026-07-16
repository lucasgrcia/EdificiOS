import { BadRequestException } from '@nestjs/common';

export function validateRequiredPathParam(
  value: string,
  message: string,
): string {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new BadRequestException(message);
  }

  return trimmed;
}
