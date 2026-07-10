import { IncidentView } from './incident-view';

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

export type DashboardView = {
  generatedAt: string;
  totals: {
    sites: number;
    incidents: DashboardIncidentCounts;
  };
  sites: DashboardSiteSummary[];
  openIncidents: IncidentView[];
};
