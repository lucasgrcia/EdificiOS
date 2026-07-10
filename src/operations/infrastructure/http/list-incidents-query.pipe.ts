import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

import { IncidentStatus } from '../../domain/incident';
import { ListIncidentsQueryDto } from './list-incidents-query.dto';

const SUPPORTED_STATUSES: readonly IncidentStatus[] = [
  'DETECTED',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
];

@Injectable()
export class ListIncidentsQueryPipe
  implements PipeTransform<unknown, ListIncidentsQueryDto>
{
  transform(value: unknown): ListIncidentsQueryDto {
    if (value === undefined || value === null) {
      return {};
    }

    if (!this.isObject(value)) {
      throw new BadRequestException('Incident query parameters are invalid.');
    }

    const query: ListIncidentsQueryDto = {};

    if ('status' in value) {
      query.status = this.readStatus(value);
    }

    if ('assetId' in value) {
      query.assetId = this.readOptionalString(value, 'assetId', 'Asset id is invalid.');
    }

    if ('shiftId' in value) {
      query.shiftId = this.readOptionalString(value, 'shiftId', 'Shift id is invalid.');
    }

    if ('actorId' in value) {
      query.actorId = this.readOptionalString(value, 'actorId', 'Actor id is invalid.');
    }

    if ('siteId' in value) {
      query.siteId = this.readOptionalString(value, 'siteId', 'Site id is invalid.');
    }

    return query;
  }

  private isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private readStatus(value: Record<string, unknown>): IncidentStatus {
    if (typeof value.status !== 'string') {
      throw new BadRequestException('Incident status is invalid.');
    }

    const trimmed = value.status.trim();

    if (!SUPPORTED_STATUSES.includes(trimmed as IncidentStatus)) {
      throw new BadRequestException('Incident status is not supported.');
    }

    return trimmed as IncidentStatus;
  }

  private readOptionalString(
    value: Record<string, unknown>,
    field: string,
    message: string,
  ): string {
    if (typeof value[field] !== 'string') {
      throw new BadRequestException(message);
    }

    const trimmed = value[field].trim();

    if (trimmed.length === 0) {
      throw new BadRequestException(message);
    }

    return trimmed;
  }
}
