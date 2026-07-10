export class ShiftNotFoundError extends Error {
  constructor(readonly shiftId: string) {
    super('Shift was not found.');
    this.name = 'ShiftNotFoundError';
  }
}
