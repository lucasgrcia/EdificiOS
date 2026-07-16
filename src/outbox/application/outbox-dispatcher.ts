import { OutboxDispatchRepository } from './outbox-dispatch-repository';
import { OutboxDispatchSummary } from './outbox-message';
import { OutboxProcessor } from './outbox-processor';

export type OutboxDispatcherDependencies = {
  outboxDispatchRepository: OutboxDispatchRepository;
  outboxProcessor: OutboxProcessor;
  clock: { now(): Date };
  maxRetries: number;
  batchSize: number;
};

export class OutboxDispatcher {
  constructor(private readonly dependencies: OutboxDispatcherDependencies) {}

  async dispatch(
    batchSize: number = this.dependencies.batchSize,
  ): Promise<OutboxDispatchSummary> {
    const messages =
      await this.dependencies.outboxDispatchRepository.claimPending(batchSize);

    const summary: OutboxDispatchSummary = {
      claimed: messages.length,
      processed: 0,
      failed: 0,
      retried: 0,
    };

    for (const message of messages) {
      const result = await this.dependencies.outboxProcessor.process(message);

      if (result.kind === 'success') {
        await this.dependencies.outboxDispatchRepository.markProcessed(
          message.id,
          this.dependencies.clock.now(),
        );
        summary.processed += 1;
        continue;
      }

      const nextRetryCount = message.retryCount + 1;
      const permanent = nextRetryCount >= this.dependencies.maxRetries;

      await this.dependencies.outboxDispatchRepository.recordFailure(
        message.id,
        result.error,
        {
          retryCount: nextRetryCount,
          failedAt: this.dependencies.clock.now(),
          permanent,
        },
      );

      if (permanent) {
        summary.failed += 1;
      } else {
        summary.retried += 1;
      }
    }

    return summary;
  }
}
