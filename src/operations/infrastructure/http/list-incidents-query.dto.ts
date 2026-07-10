import { IncidentStatus } from '../../domain/incident';

export class ListIncidentsQueryDto {
  status?: IncidentStatus;
  assetId?: string;
  shiftId?: string;
  actorId?: string;
  siteId?: string;
}
