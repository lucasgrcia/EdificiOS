import { ApplicationLogger } from '../src/shared/logging/application-logger';
import { NotificationOutboxHandler } from '../src/outbox/infrastructure/handlers/notification-outbox-handler';
import { OutboxMessage } from '../src/outbox/application/outbox-message';

describe('NotificationOutboxHandler integration', () => {
  const baseMessage: OutboxMessage = {
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

  function createHandler() {
    const logger = {
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as ApplicationLogger;

    return {
      handler: new NotificationOutboxHandler(logger),
      logger,
    };
  }

  it('supports workflow incident events', () => {
    const { handler } = createHandler();

    expect(handler.supports(baseMessage)).toBe(true);
    expect(
      handler.supports({
        ...baseMessage,
        payload: { name: 'workflow.flow.assigned' },
      }),
    ).toBe(true);
  });

  it('does not support unknown event names', () => {
    const { handler } = createHandler();

    expect(
      handler.supports({
        ...baseMessage,
        payload: { name: 'workflow.flow.unknown' },
      }),
    ).toBe(false);
  });

  it('processes supported messages successfully', async () => {
    const { handler, logger } = createHandler();

    const result = await handler.handle(baseMessage);

    expect(result).toEqual({ kind: 'success' });
    expect(logger.info).toHaveBeenCalled();
  });
});
