import { AssetId } from './value-objects/asset-id';
import { AssetName } from './value-objects/asset-name';
import { AssetType } from './value-objects/asset-type';
import { Criticality } from './value-objects/criticality';
import { Location } from './value-objects/location';
import { Manufacturer } from './value-objects/manufacturer';
import { Model } from './value-objects/model';
import { SerialNumber } from './value-objects/serial-number';

export type RegisterAssetInput = {
  assetId: string;
  name: string;
  type: string;
  manufacturer?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  location: string;
  criticality: string;
};

export type RehydrateAssetInput = {
  assetId: string;
  name: string;
  type: string;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  location: string;
  criticality: string;
};

export class AssetAggregate {
  private constructor(
    private readonly assetIdentifier: AssetId,
    private readonly assetName: AssetName,
    private readonly assetType: AssetType,
    private readonly assetManufacturer: Manufacturer | null,
    private readonly assetModel: Model | null,
    private readonly assetSerialNumber: SerialNumber | null,
    private readonly assetLocation: Location,
    private readonly assetCriticality: Criticality,
  ) {}

  static register(input: RegisterAssetInput): AssetAggregate {
    if (input.assetId.trim().length === 0) {
      throw new Error('Asset id is required.');
    }

    return new AssetAggregate(
      AssetId.create(input.assetId),
      AssetName.create(input.name),
      AssetType.create(input.type),
      input.manufacturer === undefined || input.manufacturer === null
        ? null
        : Manufacturer.create(input.manufacturer),
      input.model === undefined || input.model === null
        ? null
        : Model.create(input.model),
      input.serialNumber === undefined || input.serialNumber === null
        ? null
        : SerialNumber.create(input.serialNumber),
      Location.create(input.location),
      Criticality.create(input.criticality),
    );
  }

  static rehydrate(input: RehydrateAssetInput): AssetAggregate {
    if (input.assetId.trim().length === 0) {
      throw new Error('Asset id is required.');
    }

    return new AssetAggregate(
      AssetId.create(input.assetId),
      AssetName.create(input.name),
      AssetType.create(input.type),
      input.manufacturer === null
        ? null
        : Manufacturer.create(input.manufacturer),
      input.model === null ? null : Model.create(input.model),
      input.serialNumber === null
        ? null
        : SerialNumber.create(input.serialNumber),
      Location.create(input.location),
      Criticality.create(input.criticality),
    );
  }

  get id(): string {
    return this.assetIdentifier.toString();
  }

  get name(): string {
    return this.assetName.toString();
  }

  get type(): string {
    return this.assetType.toString();
  }

  get manufacturer(): string | null {
    return this.assetManufacturer?.toString() ?? null;
  }

  get model(): string | null {
    return this.assetModel?.toString() ?? null;
  }

  get serialNumber(): string | null {
    return this.assetSerialNumber?.toString() ?? null;
  }

  get location(): string {
    return this.assetLocation.toString();
  }

  get criticality(): string {
    return this.assetCriticality.toString();
  }
}
