import { ApiPropertyOptional } from '@nestjs/swagger';

import { IncidentStatus } from '../../domain/incident';

export class ListIncidentsQueryDto {
  @ApiPropertyOptional({
    enum: ['DETECTED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED'],
  })
  status?: IncidentStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  assetId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  shiftId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  actorId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  siteId?: string;
}
