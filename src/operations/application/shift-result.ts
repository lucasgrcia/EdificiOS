export type ShiftResult = {
  id: string;
  siteId: string;
  actorId: string;
  type: string;
  status: string;
  startedAt: Date;
  endedAt: Date | null;
};
