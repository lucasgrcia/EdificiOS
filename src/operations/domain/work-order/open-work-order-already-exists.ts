export class OpenWorkOrderAlreadyExistsError extends Error {
  constructor(readonly incidentId: string) {
    super('An open work order already exists for this incident.');
    this.name = 'OpenWorkOrderAlreadyExistsError';
  }
}
