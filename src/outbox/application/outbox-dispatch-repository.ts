import { OutboxMessage } from './outbox-message';

export interface OutboxDispatchRepository {
  claimPending(limit: number): Promise<OutboxMessage[]>;
  markProcessed(id: string, processedAt: Date): Promise<void>;
  recordFailure(
    id: string,
    error: string,
    options: { retryCount: number; failedAt: Date; permanent: boolean },
  ): Promise<void>;
}
