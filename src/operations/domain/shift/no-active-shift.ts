export class NoActiveShiftError extends Error {
  constructor(readonly siteId: string) {
    super('No active shift was found for this site.');
    this.name = 'NoActiveShiftError';
  }
}
