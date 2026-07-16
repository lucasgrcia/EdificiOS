export type OutboxMessage = {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventId: string;
  correlationId: string | null;
  payload: Record<string, unknown>;
  status: 'pending' | 'processed' | 'failed';
  retryCount: number;
  createdAt: Date;
};

export type OutboxDispatchSummary = {
  claimed: number;
  processed: number;
  failed: number;
  retried: number;
};
