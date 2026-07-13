import { BadRequestException } from '@nestjs/common';

export const JSON_CONTENT_TYPE = 'application/json';

export const HTTP_VALIDATION_MESSAGES = {
  INVALID_CONTENT_TYPE: 'Content-Type must be application/json.',
  BODY_NULL: 'Request body cannot be null.',
  BODY_MUST_BE_JSON_OBJECT: 'Request body must be a JSON object.',
} as const;

export function normalizeContentType(
  header: string | string[] | undefined,
): string | undefined {
  if (header === undefined) {
    return undefined;
  }

  const value = Array.isArray(header) ? header[0] : header;

  return value.split(';')[0]?.trim().toLowerCase();
}

export function isJsonContentType(contentType: string | undefined): boolean {
  return contentType === JSON_CONTENT_TYPE;
}

export function isJsonObjectPayload(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function requestHasBody(input: {
  value: unknown;
  contentLength: string | string[] | undefined;
}): boolean {
  if (input.value !== undefined) {
    return true;
  }

  const contentLength = Array.isArray(input.contentLength)
    ? input.contentLength[0]
    : input.contentLength;

  if (contentLength === undefined) {
    return false;
  }

  const parsed = Number.parseInt(contentLength, 10);

  return Number.isFinite(parsed) && parsed > 0;
}

export function validateHttpJsonBody(input: {
  value: unknown;
  contentType: string | string[] | undefined;
  contentLength: string | string[] | undefined;
}): Record<string, unknown> {
  if (input.value === null) {
    throwHttpValidationError(HTTP_VALIDATION_MESSAGES.BODY_NULL);
  }

  if (
    requestHasBody({
      value: input.value,
      contentLength: input.contentLength,
    }) &&
    !isJsonContentType(normalizeContentType(input.contentType))
  ) {
    throwHttpValidationError(HTTP_VALIDATION_MESSAGES.INVALID_CONTENT_TYPE);
  }

  if (!isJsonObjectPayload(input.value)) {
    throwHttpValidationError(HTTP_VALIDATION_MESSAGES.BODY_MUST_BE_JSON_OBJECT);
  }

  return input.value;
}

function throwHttpValidationError(message: string): never {
  throw new BadRequestException(message);
}
