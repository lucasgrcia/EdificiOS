import { IncidentStatus } from '../domain/incident';
import { ActivityFeedEntry } from './activity-feed-entry';
import { AssetRepository } from './asset-persistence';
import {
  DashboardIncidentCounts,
  DashboardSiteSummary,
  DashboardSummary,
  DashboardView,
} from './dashboard-view';
import { EventQueryRepository } from './event-query-persistence';
import { EventQueryView } from './event-query-view';
import { Clock } from './incident-persistence';
import { IncidentQueryRepository } from './incident-query-persistence';
import { IncidentView } from './incident-view';
import { NotificationQueryRepository } from './notification-query-persistence';
import { NotificationQueryView } from './notification-query-view';
import { NotificationView } from './notification-view';
import { ShiftRepository } from './shift-persistence';
import { SiteRepository } from './site-persistence';
import { WorkOrderQueryRepository } from './work-order-query-persistence';
import { WorkOrderQueryView } from './work-order-query-view';

const DASHBOARD_RECENT_LIMIT = 10;
const DASHBOARD_SUMMARY_LOOKUP_LIMIT = 100;
const ACTIVITY_FEED_MAX_ITEMS = 20;

export type GetOperationsDashboardCommand = {
  actorId?: string;
};

export type GetOperationsDashboardUseCaseDependencies = {
  siteRepository: SiteRepository;
  assetRepository: AssetRepository;
  shiftRepository: ShiftRepository;
  incidentQueryRepository: IncidentQueryRepository;
  eventQueryRepository: EventQueryRepository;
  workOrderQueryRepository: WorkOrderQueryRepository;
  notificationQueryRepository: NotificationQueryRepository;
  clock: Clock;
};

export class GetOperationsDashboardUseCase {
  constructor(
    private readonly dependencies: GetOperationsDashboardUseCaseDependencies,
  ) {}

  async execute(
    command?: GetOperationsDashboardCommand,
  ): Promise<DashboardView> {
    const actorId = command?.actorId?.trim();
    const notificationsPromise =
      actorId !== undefined && actorId.length > 0
        ? this.dependencies.notificationQueryRepository.findByRecipient(actorId)
        : Promise.resolve([]);

    const [
      sites,
      incidents,
      recentEvents,
      summaryWorkOrders,
      summaryNotifications,
      notifications,
    ] = await Promise.all([
      this.dependencies.siteRepository.findAll(),
      this.dependencies.incidentQueryRepository.findAll({}),
      this.dependencies.eventQueryRepository.findRecent(
        DASHBOARD_RECENT_LIMIT,
      ),
      this.dependencies.workOrderQueryRepository.findRecent(
        DASHBOARD_SUMMARY_LOOKUP_LIMIT,
      ),
      this.dependencies.notificationQueryRepository.findRecent(
        DASHBOARD_SUMMARY_LOOKUP_LIMIT,
      ),
      notificationsPromise,
    ]);

    const siteSummaries: DashboardSiteSummary[] = [];
    let totalAssets = 0;
    let activeShifts = 0;

    for (const site of sites) {
      const assets = await this.dependencies.assetRepository.findBySite(site.id);
      totalAssets += assets.length;
      const assetIds = new Set(assets.map((asset) => asset.id));
      const siteIncidents = incidents.filter((incident) =>
        assetIds.has(incident.assetId),
      );
      const activeShiftsForSite =
        await this.dependencies.shiftRepository.findActiveBySite(site.id);
      activeShifts += activeShiftsForSite.length;
      const activeShift = activeShiftsForSite[0] ?? null;

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

    const now = this.dependencies.clock.now();
    const openIncidents = incidents
      .filter((incident) => incident.status !== 'RESOLVED')
      .sort(
        (left, right) =>
          new Date(right.detectedAt).getTime() -
          new Date(left.detectedAt).getTime(),
      );

    const recentIncidents = incidents.slice(0, DASHBOARD_RECENT_LIMIT);
    const recentWorkOrders = summaryWorkOrders.slice(0, DASHBOARD_RECENT_LIMIT);
    const recentNotifications = summaryNotifications.slice(
      0,
      DASHBOARD_RECENT_LIMIT,
    );

    return {
      generatedAt: now.toISOString(),
      summary: buildDashboardSummary({
        totalSites: sites.length,
        totalAssets,
        activeShifts,
        incidents,
        summaryWorkOrders,
        summaryNotifications,
        actorNotifications: notifications,
        actorId,
        now,
      }),
      totals: {
        sites: sites.length,
        incidents: countIncidentsByStatus(incidents),
      },
      sites: siteSummaries,
      openIncidents,
      recentEvents,
      recentIncidents,
      recentWorkOrders,
      recentNotifications,
      notifications,
      activityFeed: buildActivityFeed({
        recentEvents,
        recentIncidents,
        recentWorkOrders,
        recentNotifications,
      }),
    };
  }
}

function buildActivityFeed(input: {
  recentEvents: EventQueryView[];
  recentIncidents: IncidentView[];
  recentWorkOrders: WorkOrderQueryView[];
  recentNotifications: NotificationQueryView[];
}): ActivityFeedEntry[] {
  const entries: ActivityFeedEntry[] = [
    ...input.recentEvents.map((event) => ({
      timestamp: new Date(event.occurredAt),
      type: 'EVENT' as const,
      title: event.name,
      description: event.name,
      ...(event.actorId !== null ? { actorId: event.actorId } : {}),
    })),
    ...input.recentIncidents.map((incident) => ({
      timestamp: new Date(incident.detectedAt),
      type: 'INCIDENT' as const,
      title: 'Incident',
      description: incident.description,
      actorId: incident.actorId,
    })),
    ...input.recentWorkOrders.map((workOrder) => ({
      timestamp: new Date(workOrder.createdAt),
      type: 'WORK_ORDER' as const,
      title: 'Work Order',
      description: workOrder.description,
      actorId: workOrder.actorId,
    })),
    ...input.recentNotifications.map((notification) => ({
      timestamp: new Date(notification.createdAt),
      type: 'NOTIFICATION' as const,
      title: 'Notification',
      description: notification.message,
      actorId: notification.recipientId,
    })),
  ];

  return entries
    .sort(
      (left, right) => right.timestamp.getTime() - left.timestamp.getTime(),
    )
    .slice(0, ACTIVITY_FEED_MAX_ITEMS);
}

function buildDashboardSummary(input: {
  totalSites: number;
  totalAssets: number;
  activeShifts: number;
  incidents: IncidentView[];
  summaryWorkOrders: WorkOrderQueryView[];
  summaryNotifications: NotificationQueryView[];
  actorNotifications: NotificationView[];
  actorId: string | undefined;
  now: Date;
}): DashboardSummary {
  return {
    totalSites: input.totalSites,
    totalAssets: input.totalAssets,
    activeShifts: input.activeShifts,
    openIncidents: input.incidents.filter(
      (incident) => incident.status !== 'RESOLVED',
    ).length,
    inProgressIncidents: input.incidents.filter(
      (incident) => incident.status === 'IN_PROGRESS',
    ).length,
    resolvedToday: input.incidents.filter(
      (incident) =>
        incident.status === 'RESOLVED' &&
        incident.resolvedAt !== null &&
        isSameUtcDay(incident.resolvedAt, input.now),
    ).length,
    openWorkOrders: input.summaryWorkOrders.filter(
      (workOrder) => workOrder.status === 'OPEN',
    ).length,
    completedToday: input.summaryWorkOrders.filter(
      (workOrder) =>
        workOrder.status === 'COMPLETED' &&
        isSameUtcDay(workOrder.createdAt, input.now),
    ).length,
    pendingNotifications: countPendingNotifications(
      input.actorId,
      input.actorNotifications,
      input.summaryNotifications,
    ),
  };
}

function countPendingNotifications(
  actorId: string | undefined,
  actorNotifications: NotificationView[],
  summaryNotifications: NotificationQueryView[],
): number {
  if (actorId !== undefined && actorId.length > 0) {
    return actorNotifications.filter(
      (notification) => notification.status === 'PENDING',
    ).length;
  }

  return summaryNotifications.length;
}

function isSameUtcDay(timestamp: string, reference: Date): boolean {
  const value = new Date(timestamp);

  return (
    value.getUTCFullYear() === reference.getUTCFullYear() &&
    value.getUTCMonth() === reference.getUTCMonth() &&
    value.getUTCDate() === reference.getUTCDate()
  );
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
