export type ShiftResult = {
  id: string;
  siteId: string;
  operatorId: string;
  type: string;
  status: string;
  startedAt: Date;
  endedAt: Date | null;
};
