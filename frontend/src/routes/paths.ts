export const ROUTES = {
  home: '/',
  login: '/login',
  dashboard: '/dashboard',
  incidentDetails: '/incidents/:incidentId',
} as const;

export function incidentDetailsPath(incidentId: string): string {
  return `/incidents/${incidentId}`;
}
