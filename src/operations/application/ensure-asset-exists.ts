import { AssetId } from './asset/value-objects/asset-id';
import { AssetRepository } from './asset-persistence';
import { AssetNotFoundError } from '../domain/asset/asset-not-found';

export async function ensureAssetExists(
  assetRepository: AssetRepository,
  assetId: string,
): Promise<AssetId> {
  const record = await assetRepository.findById(assetId);

  if (record === null) {
    throw AssetNotFoundError.forId(assetId);
  }

  return AssetId.create(record.id);
}
