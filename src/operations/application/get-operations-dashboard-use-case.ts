import { IncidentStatus } from '../domain/incident';
import { AssetRepository } from './asset-persistence';
import {
  DashboardIncidentCounts,
  DashboardSiteSummary,
  DashboardView,
} from './dashboard-view';
import { Clock } from './incident-persistence';
import { IncidentQueryRepository } from './incident-query-persistence';
import { IncidentView } from './incident-view';
import { ShiftRepository } from './shift-persistence';
import { SiteRepository } from './site-persistence';

export type GetOperationsDashboardUseCaseDependencies = {
  siteRepository: SiteRepository;
  assetRepository: AssetRepository;
  shiftRepository: ShiftRepository;
  incidentQueryRepository: IncidentQueryRepository;
  clock: Clock;
};

export class GetOperationsDashboardUseCase {
  constructor(
    private readonly dependencies: GetOperationsDashboardUseCaseDependencies,
  ) {}

  async execute(): Promise<DashboardView> {
    const [sites, incidents] = await Promise.all([
      this.dependencies.siteRepository.findAll(),
      this.dependencies.incidentQueryRepository.findAll({}),
    ]);

    const siteSummaries: DashboardSiteSummary[] = [];

    for (const site of sites) {
      const assets = await this.dependencies.assetRepository.findBySite(site.id);
      const assetIds = new Set(assets.map((asset) => asset.id));
      const siteIncidents = incidents.filter((incident) =>
        assetIds.has(incident.assetId),
      );
      const activeShifts =
        await this.dependencies.shiftRepository.findActiveBySite(site.id);
      const activeShift = activeShifts[0] ?? null;

      siteSummaries.push({
        id: site.id,
        name: site.name,
        activeShift:
          activeShift === null
            ? null
            : {
                id: activeShift.id,
                actorId: activeShift.actorId,
                type: activeShift.type,
                startedAt: activeShift.startedAt.toISOString(),
              },
        incidents: countIncidentsByStatus(siteIncidents),
      });
    }

    const openIncidents = incidents
      .filter((incident) => incident.status !== 'RESOLVED')
      .sort(
        (left, right) =>
          new Date(right.detectedAt).getTime() -
          new Date(left.detectedAt).getTime(),
      );

    return {
      generatedAt: this.dependencies.clock.now().toISOString(),
      totals: {
        sites: sites.length,
        incidents: countIncidentsByStatus(incidents),
      },
      sites: siteSummaries,
      openIncidents,
    };
  }
}

function countIncidentsByStatus(
  incidents: IncidentView[],
): DashboardIncidentCounts {
  return incidents.reduce<DashboardIncidentCounts>(
    (counts, incident) => {
      switch (incident.status as IncidentStatus) {
        case 'DETECTED':
          counts.detected += 1;
          break;
        case 'ASSIGNED':
          counts.assigned += 1;
          break;
        case 'IN_PROGRESS':
          counts.inProgress += 1;
          break;
        case 'RESOLVED':
          counts.resolved += 1;
          break;
      }

      return counts;
    },
    {
      detected: 0,
      assigned: 0,
      inProgress: 0,
      resolved: 0,
    },
  );
}
