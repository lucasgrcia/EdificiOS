import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import {
  isHttpPayloadObject,
  readRequiredString,
} from '../../../shared/http/http-request-parsing';
import { RegisterAssetRequestDto } from './register-asset.dto';

const ALLOWED_CRITICALITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

@Injectable()
export class RegisterAssetRequestPipe
  implements PipeTransform<unknown, RegisterAssetRequestDto>
{
  transform(value: unknown): RegisterAssetRequestDto {
    if (!isHttpPayloadObject(value)) {
      throw new BadRequestException('Asset payload is required.');
    }

    return {
      siteId: readRequiredString(value, 'siteId', 'Site id is required.'),
      name: readRequiredString(value, 'name', 'Asset name is required.'),
      type: readRequiredString(value, 'type', 'Asset type is required.'),
      manufacturer: this.readOptionalString(value, 'manufacturer'),
      model: this.readOptionalString(value, 'model'),
      serialNumber: this.readOptionalString(value, 'serialNumber'),
      location: readRequiredString(value, 'location', 'Location is required.'),
      criticality: this.readCriticality(value),
    };
  }

  private readOptionalString(
    value: Record<string, unknown>,
    field: string,
  ): string | null | undefined {
    if (!(field in value)) {
      return undefined;
    }

    if (value[field] === null) {
      return null;
    }

    if (typeof value[field] !== 'string') {
      throw new BadRequestException(`${field} must be a string or null.`);
    }

    const trimmed = value[field].trim();

    if (trimmed.length === 0) {
      return null;
    }

    return trimmed;
  }

  private readCriticality(value: Record<string, unknown>): string {
    if (!('criticality' in value) || typeof value.criticality !== 'string') {
      throw new BadRequestException('Criticality is required.');
    }

    const normalized = value.criticality.trim().toUpperCase();

    if (normalized.length === 0) {
      throw new BadRequestException('Criticality is required.');
    }

    if (
      !ALLOWED_CRITICALITIES.includes(
        normalized as (typeof ALLOWED_CRITICALITIES)[number],
      )
    ) {
      throw new BadRequestException('Criticality is not supported.');
    }

    return normalized;
  }
}
