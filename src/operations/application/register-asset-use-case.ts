import { AssetAggregate } from '../domain/asset/asset';
import { AssetRepository } from './asset-persistence';
import { AssetResult } from './asset-result';
import { IdGenerator } from './incident-persistence';
import { toAssetRecord, toAssetResult } from './map-asset';

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
  idGenerator: IdGenerator;
};

export class RegisterAssetUseCase {
  constructor(
    private readonly dependencies: RegisterAssetUseCaseDependencies,
  ) {}

  async execute(command: RegisterAssetCommand): Promise<AssetResult> {
    const assetId = this.dependencies.idGenerator.generate();
    const asset = AssetAggregate.register({
      assetId,
      name: command.name,
      type: command.type,
      manufacturer: command.manufacturer,
      model: command.model,
      serialNumber: command.serialNumber,
      location: command.location,
      criticality: command.criticality,
    });

    const record = toAssetRecord(asset, command.siteId);
    await this.dependencies.assetRepository.save(record);

    return toAssetResult(record);
  }
}
