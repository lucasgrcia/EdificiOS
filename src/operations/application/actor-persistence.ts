export type ActorRecord = {
  id: string;
  siteId: string;
  name: string;
  role: string;
  status: string;
};

export interface ActorRepository {
  save(actor: ActorRecord): Promise<void>;
  findById(id: string): Promise<ActorRecord | null>;
  findBySite(siteId: string): Promise<ActorRecord[]>;
}
