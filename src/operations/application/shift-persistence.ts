export type ShiftRecord = {
  id: string;
  siteId: string;
  operatorId: string;
  type: string;
  status: string;
  startedAt: Date;
  endedAt: Date | null;
};

export interface ShiftRepository {
  save(shift: ShiftRecord): Promise<void>;
  findById(id: string): Promise<ShiftRecord | null>;
  findActiveBySite(siteId: string): Promise<ShiftRecord[]>;
  update(shift: ShiftRecord): Promise<void>;
}
