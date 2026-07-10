import { AssetAggregate } from '../domain/asset/asset';
import { AssetRecord } from './asset-persistence';
import { AssetResult } from './asset-result';

export function toAssetRecord(
  asset: AssetAggregate,
  siteId: string,
): AssetRecord {
  return {
    id: asset.id,
    siteId,
    name: asset.name,
    type: asset.type,
    manufacturer: asset.manufacturer,
    model: asset.model,
    serialNumber: asset.serialNumber,
    location: asset.location,
    criticality: asset.criticality,
  };
}

export function toAssetResult(record: AssetRecord): AssetResult {
  const asset = AssetAggregate.rehydrate({
    assetId: record.id,
    name: record.name,
    type: record.type,
    manufacturer: record.manufacturer,
    model: record.model,
    serialNumber: record.serialNumber,
    location: record.location,
    criticality: record.criticality,
  });

  return {
    id: asset.id,
    siteId: record.siteId,
    name: asset.name,
    type: asset.type,
    manufacturer: asset.manufacturer,
    model: asset.model,
    serialNumber: asset.serialNumber,
    location: asset.location,
    criticality: asset.criticality,
  };
}
