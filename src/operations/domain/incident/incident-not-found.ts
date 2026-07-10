export class IncidentNotFoundError extends Error {
  constructor(readonly incidentId: string) {
    super('Incident was not found.');
    this.name = 'IncidentNotFoundError';
  }
}
