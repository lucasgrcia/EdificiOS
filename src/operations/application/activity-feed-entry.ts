export type ActivityFeedEntryType =
  | 'EVENT'
  | 'INCIDENT'
  | 'WORK_ORDER'
  | 'NOTIFICATION';

export type ActivityFeedEntry = {
  timestamp: Date;
  type: ActivityFeedEntryType;
  title: string;
  description: string;
  actorId?: string;
};
