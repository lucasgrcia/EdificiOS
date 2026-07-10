export type AssetResult = {
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
