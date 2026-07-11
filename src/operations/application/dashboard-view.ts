import { ActivityFeedEntry } from './activity-feed-entry';
import { IncidentView } from './incident-view';
import { EventQueryView } from './event-query-view';
import { NotificationQueryView } from './notification-query-view';
import { NotificationView } from './notification-view';
import { WorkOrderQueryView } from './work-order-query-view';

export type DashboardIncidentCounts = {
  detected: number;
  assigned: number;
  inProgress: number;
  resolved: number;
};

export type DashboardActiveShiftSummary = {
  id: string;
  actorId: string;
  type: string;
  startedAt: string;
};

export type DashboardSiteSummary = {
  id: string;
  name: string;
  activeShift: DashboardActiveShiftSummary | null;
  incidents: DashboardIncidentCounts;
};

export type DashboardSummary = {
  totalSites: number;
  totalAssets: number;
  activeShifts: number;
  openIncidents: number;
  inProgressIncidents: number;
  resolvedToday: number;
  openWorkOrders: number;
  completedToday: number;
  pendingNotifications: number;
};

export type DashboardView = {
  generatedAt: string;
  summary: DashboardSummary;
  totals: {
    sites: number;
    incidents: DashboardIncidentCounts;
  };
  sites: DashboardSiteSummary[];
  openIncidents: IncidentView[];
  recentEvents: EventQueryView[];
  recentIncidents: IncidentView[];
  recentWorkOrders: WorkOrderQueryView[];
  recentNotifications: NotificationQueryView[];
  notifications: NotificationView[];
  activityFeed: ActivityFeedEntry[];
};
