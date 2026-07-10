export class ActorNotFoundError extends Error {
  constructor(readonly actorId: string) {
    super('Actor was not found.');
    this.name = 'ActorNotFoundError';
  }
}
