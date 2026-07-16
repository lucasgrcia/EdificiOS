export const ROUTES = {
  home: '/',
  login: '/login',
  dashboard: '/dashboard',
  incidents: '/incidents',
  incidentDetails: '/incidents/:incidentId',
  apiDocs: '/api/docs',
} as const;

export function incidentDetailsPath(incidentId: string): string {
  return `/incidents/${incidentId}`;
}
