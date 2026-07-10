export class SiteNotFoundError extends Error {
  constructor(readonly siteId: string) {
    super('Site was not found.');
    this.name = 'SiteNotFoundError';
  }
}
