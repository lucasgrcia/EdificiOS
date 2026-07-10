import { AssetRepository } from './asset-persistence';
import { AssetResult } from './asset-result';
import { toAssetResult } from './map-asset';

export type ListAssetsBySiteCommand = {
  siteId: string;
};

export type ListAssetsBySiteUseCaseDependencies = {
  assetRepository: AssetRepository;
};

export class ListAssetsBySiteUseCase {
  constructor(
    private readonly dependencies: ListAssetsBySiteUseCaseDependencies,
  ) {}

  async execute(command: ListAssetsBySiteCommand): Promise<AssetResult[]> {
    const records = await this.dependencies.assetRepository.findBySite(
      command.siteId,
    );

    return records.map((record) => toAssetResult(record));
  }
}
