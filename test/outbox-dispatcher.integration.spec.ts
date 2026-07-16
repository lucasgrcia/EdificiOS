import { OutboxDispatchRepository } from '../src/outbox/application/outbox-dispatch-repository';
import { OutboxDispatcher } from '../src/outbox/application/outbox-dispatcher';
import { OutboxMessage } from '../src/outbox/application/outbox-message';
import { OutboxProcessor } from '../src/outbox/application/outbox-processor';

describe('OutboxDispatcher integration', () => {
  const fixedNow = new Date('2026-07-10T12:00:00.000Z');
  const message: OutboxMessage = {
    id: '00000000-0000-0000-0000-000000000001',
    aggregateType: 'Incident',
    aggregateId: '00000000-0000-0000-0000-000000000101',
    eventId: '00000000-0000-0000-0000-000000000201',
    correlationId: '00000000-0000-0000-0000-000000000301',
    payload: {
      name: 'workflow.flow.detected',
    },
    status: 'pending',
    retryCount: 0,
    createdAt: new Date('2026-07-10T08:00:00.000Z'),
  };

  function createHarness(options?: {
    claimPending?: OutboxMessage[];
    processResult?: { kind: 'success' } | { kind: 'failure'; error: string };
  }) {
    const repository: OutboxDispatchRepository = {
      claimPending: jest.fn(async () => options?.claimPending ?? [message]),
      markProcessed: jest.fn(async () => undefined),
      recordFailure: jest.fn(async () => undefined),
    };
    const processor = {
      process: jest.fn(
        async () => options?.processResult ?? ({ kind: 'success' } as const),
      ),
    };
    const dispatcher = new OutboxDispatcher({
      outboxDispatchRepository: repository,
      outboxProcessor: processor as unknown as OutboxProcessor,
      clock: {
        now: () => fixedNow,
      },
      maxRetries: 3,
      batchSize: 10,
    });

    return { dispatcher, repository, processor };
  }

  it('marks processed messages on success', async () => {
    const harness = createHarness();

    const summary = await harness.dispatcher.dispatch();

    expect(summary).toEqual({
      claimed: 1,
      processed: 1,
      failed: 0,
      retried: 0,
    });
    expect(harness.repository.markProcessed).toHaveBeenCalledWith(
      message.id,
      fixedNow,
    );
    expect(harness.repository.recordFailure).not.toHaveBeenCalled();
  });

  it('schedules retry when handler fails and retries remain', async () => {
    const harness = createHarness({
      processResult: { kind: 'failure', error: 'Temporary failure.' },
    });

    const summary = await harness.dispatcher.dispatch();

    expect(summary).toEqual({
      claimed: 1,
      processed: 0,
      failed: 0,
      retried: 1,
    });
    expect(harness.repository.recordFailure).toHaveBeenCalledWith(
      message.id,
      'Temporary failure.',
      {
        retryCount: 1,
        failedAt: fixedNow,
        permanent: false,
      },
    );
  });

  it('marks permanent failure when max retries is reached', async () => {
    const exhaustedMessage = { ...message, retryCount: 2 };
    const harness = createHarness({
      claimPending: [exhaustedMessage],
      processResult: { kind: 'failure', error: 'Permanent failure.' },
    });

    const summary = await harness.dispatcher.dispatch();

    expect(summary).toEqual({
      claimed: 1,
      processed: 0,
      failed: 1,
      retried: 0,
    });
    expect(harness.repository.recordFailure).toHaveBeenCalledWith(
      exhaustedMessage.id,
      'Permanent failure.',
      {
        retryCount: 3,
        failedAt: fixedNow,
        permanent: true,
      },
    );
  });

  it('returns an empty summary when there are no pending messages', async () => {
    const harness = createHarness({ claimPending: [] });

    const summary = await harness.dispatcher.dispatch();

    expect(summary).toEqual({
      claimed: 0,
      processed: 0,
      failed: 0,
      retried: 0,
    });
    expect(harness.processor.process).not.toHaveBeenCalled();
  });
});
