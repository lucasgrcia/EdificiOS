export type AssetRecord = {
  id: string;
  siteId: string;
  name: string;
  type: string;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  location: string;
  criticality: string;
};

export interface AssetRepository {
  save(asset: AssetRecord): Promise<void>;
  findById(id: string): Promise<AssetRecord | null>;
  findBySite(siteId: string): Promise<AssetRecord[]>;
}
