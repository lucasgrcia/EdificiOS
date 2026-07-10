import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

import { RegisterAssetRequestDto } from './register-asset.dto';

const ALLOWED_CRITICALITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

@Injectable()
export class RegisterAssetRequestPipe
  implements PipeTransform<unknown, RegisterAssetRequestDto>
{
  transform(value: unknown): RegisterAssetRequestDto {
    if (!this.isObject(value)) {
      throw new BadRequestException('Asset payload is required.');
    }

    const siteId = this.readRequiredString(value, 'siteId', 'Site id is required.');
    const name = this.readRequiredString(value, 'name', 'Asset name is required.');
    const type = this.readRequiredString(value, 'type', 'Asset type is required.');
    const location = this.readRequiredString(
      value,
      'location',
      'Location is required.',
    );
    const criticality = this.readCriticality(value);

    return {
      siteId,
      name,
      type,
      manufacturer: this.readOptionalString(value, 'manufacturer'),
      model: this.readOptionalString(value, 'model'),
      serialNumber: this.readOptionalString(value, 'serialNumber'),
      location,
      criticality,
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
