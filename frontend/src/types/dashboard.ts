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

export type ActivityFeedEntryType =
  | 'EVENT'
  | 'INCIDENT'
  | 'WORK_ORDER'
  | 'NOTIFICATION';

export type ActivityFeedEntry = {
  timestamp: string;
  type: ActivityFeedEntryType;
  title: string;
  description: string;
  actorId?: string;
};

export type DashboardNotification = {
  id: string;
  recipientId: string;
  type: string;
  channel: string;
  status: string;
  message: string;
  createdAt: string;
};

export type DashboardIncidentRef = {
  id: string;
  description: string;
  actorId: string;
  detectedAt: string;
};

export type DashboardView = {
  generatedAt: string;
  summary: DashboardSummary;
  activityFeed: ActivityFeedEntry[];
  notifications: DashboardNotification[];
  recentIncidents: DashboardIncidentRef[];
};
