export class MultipleActiveShiftsError extends Error {
  constructor(readonly siteId: string) {
    super('Multiple active shifts were found for this site.');
    this.name = 'MultipleActiveShiftsError';
  }
}
