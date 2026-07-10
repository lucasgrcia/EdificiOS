export type SiteRecord = {
  id: string;
  name: string;
  address: string;
  timeZone: string;
  buildingType: string;
};

export interface SiteRepository {
  save(site: SiteRecord): Promise<void>;
  findById(id: string): Promise<SiteRecord | null>;
  findAll(): Promise<SiteRecord[]>;
}
