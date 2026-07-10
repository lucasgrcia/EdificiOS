export class AssetNotFoundError extends Error {
  constructor(readonly assetId: string) {
    super('Asset was not found.');
    this.name = 'AssetNotFoundError';
  }
}
