export class ActiveShiftAlreadyExistsError extends Error {
  constructor(readonly siteId: string) {
    super('An active shift already exists for this site.');
    this.name = 'ActiveShiftAlreadyExistsError';
  }
}
