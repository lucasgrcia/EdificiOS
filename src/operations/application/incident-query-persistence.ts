import { IncidentStatus } from '../domain/incident';
import { IncidentView } from './incident-view';

export type IncidentQueryFilters = {
  status?: IncidentStatus;
  assetId?: string;
  assetIds?: string[];
  shiftId?: string;
  actorId?: string;
};

export interface IncidentQueryRepository {
  findById(id: string): Promise<IncidentView | null>;
  findAll(filters: IncidentQueryFilters): Promise<IncidentView[]>;
}
