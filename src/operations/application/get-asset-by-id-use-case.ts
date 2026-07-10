import { AssetRepository } from './asset-persistence';
import { AssetResult } from './asset-result';
import { toAssetResult } from './map-asset';

export type GetAssetByIdCommand = {
  assetId: string;
};

export type GetAssetByIdUseCaseDependencies = {
  assetRepository: AssetRepository;
};

export class GetAssetByIdUseCase {
  constructor(
    private readonly dependencies: GetAssetByIdUseCaseDependencies,
  ) {}

  async execute(command: GetAssetByIdCommand): Promise<AssetResult | null> {
    const record = await this.dependencies.assetRepository.findById(
      command.assetId,
    );

    if (record === null) {
      return null;
    }

    return toAssetResult(record);
  }
}
