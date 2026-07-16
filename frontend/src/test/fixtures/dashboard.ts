import type { DashboardView } from '../../types/dashboard';
import type { IncidentView, TimelineEntry } from '../../types/incident';

export const dashboardIncidentFixture = {
  id: '00000000-0000-0000-0000-000000000030',
  description: 'Fuga de agua en hall principal',
  actorId: '00000000-0000-0000-0000-000000000020',
  detectedAt: '2026-07-10T10:00:00.000Z',
} as const;

export const dashboardViewFixture: DashboardView = {
  generatedAt: '2026-07-10T12:00:00.000Z',
  summary: {
    totalSites: 1,
    totalAssets: 1,
    activeShifts: 1,
    openIncidents: 1,
    inProgressIncidents: 0,
    resolvedToday: 0,
    openWorkOrders: 0,
    completedToday: 0,
    pendingNotifications: 0,
  },
  activityFeed: [
    {
      timestamp: dashboardIncidentFixture.detectedAt,
      type: 'INCIDENT',
      title: 'Incidencia detectada',
      description: dashboardIncidentFixture.description,
      actorId: dashboardIncidentFixture.actorId,
    },
  ],
  notifications: [],
  recentIncidents: [dashboardIncidentFixture],
};

export const incidentViewFixture: IncidentView = {
  id: dashboardIncidentFixture.id,
  description: dashboardIncidentFixture.description,
  status: 'DETECTED',
  detectedAt: dashboardIncidentFixture.detectedAt,
  assetId: '00000000-0000-0000-0000-000000000040',
  shiftId: '00000000-0000-0000-0000-000000000050',
  actorId: dashboardIncidentFixture.actorId,
  assignedAt: null,
  assignedActorId: null,
  startedAt: null,
  resolvedAt: null,
  createdAt: dashboardIncidentFixture.detectedAt,
};

export const timelineFixture: TimelineEntry[] = [
  {
    timestamp: dashboardIncidentFixture.detectedAt,
    type: 'INCIDENT_DETECTED',
    description: 'Incidencia detectada en hall principal',
    actorId: dashboardIncidentFixture.actorId,
  },
];
