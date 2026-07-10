import { IncidentStatus } from '../domain/incident';
import { AssetRepository } from './asset-persistence';
import {
  IncidentQueryFilters,
  IncidentQueryRepository,
} from './incident-query-persistence';
import { IncidentView } from './incident-view';

export type ListIncidentsFilters = {
  status?: IncidentStatus;
  assetId?: string;
  shiftId?: string;
  actorId?: string;
  siteId?: string;
};

export type ListIncidentsUseCaseDependencies = {
  incidentQueryRepository: IncidentQueryRepository;
  assetRepository: AssetRepository;
};

export class ListIncidentsUseCase {
  constructor(
    private readonly dependencies: ListIncidentsUseCaseDependencies,
  ) {}

  async execute(filters: ListIncidentsFilters = {}): Promise<IncidentView[]> {
    const queryFilters: IncidentQueryFilters = {};

    if (filters.status !== undefined) {
      queryFilters.status = filters.status;
    }

    if (filters.shiftId !== undefined) {
      queryFilters.shiftId = filters.shiftId;
    }

    if (filters.actorId !== undefined) {
      queryFilters.actorId = filters.actorId;
    }

    if (filters.siteId !== undefined) {
      const assets = await this.dependencies.assetRepository.findBySite(
        filters.siteId,
      );
      const siteAssetIds = assets.map((asset) => asset.id);

      if (siteAssetIds.length === 0) {
        return [];
      }

      if (filters.assetId !== undefined) {
        if (!siteAssetIds.includes(filters.assetId)) {
          return [];
        }

        queryFilters.assetId = filters.assetId;
      } else {
        queryFilters.assetIds = siteAssetIds;
      }
    } else if (filters.assetId !== undefined) {
      queryFilters.assetId = filters.assetId;
    }

    return this.dependencies.incidentQueryRepository.findAll(queryFilters);
  }
}
