import { AssetAggregate } from '../domain/asset/asset';
import { SiteNotFoundError } from '../domain/site/site-not-found';
import { AssetRepository } from './asset-persistence';
import { AssetResult } from './asset-result';
import { IdGenerator } from './incident-persistence';
import { toAssetRecord, toAssetResult } from './map-asset';
import { SiteRepository } from './site-persistence';

export type RegisterAssetCommand = {
  siteId: string;
  name: string;
  type: string;
  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  location: string;
  criticality: string;
};

export type RegisterAssetUseCaseDependencies = {
  assetRepository: AssetRepository;
  siteRepository: SiteRepository;
  idGenerator: IdGenerator;
};

export class RegisterAssetUseCase {
  constructor(
    private readonly dependencies: RegisterAssetUseCaseDependencies,
  ) {}

  async execute(command: RegisterAssetCommand): Promise<AssetResult> {
    const site = await this.dependencies.siteRepository.findById(command.siteId);

    if (site === null) {
      throw new SiteNotFoundError(command.siteId);
    }

    const assetId = this.dependencies.idGenerator.generate();
    const asset = AssetAggregate.register({
      assetId,
      siteId: command.siteId,
      name: command.name,
      type: command.type,
      manufacturer: command.manufacturer,
      model: command.model,
      serialNumber: command.serialNumber,
      location: command.location,
      criticality: command.criticality,
    });

    const record = toAssetRecord(asset);
    await this.dependencies.assetRepository.save(record);

    return toAssetResult(record);
  }
}
