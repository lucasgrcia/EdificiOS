import { OutboxHandler } from '../src/outbox/application/outbox-handler';
import { OutboxMessage } from '../src/outbox/application/outbox-message';
import { OutboxProcessor } from '../src/outbox/application/outbox-processor';

describe('OutboxProcessor integration', () => {
  const message: OutboxMessage = {
    id: '00000000-0000-0000-0000-000000000001',
    aggregateType: 'Incident',
    aggregateId: '00000000-0000-0000-0000-000000000101',
    eventId: '00000000-0000-0000-0000-000000000201',
    correlationId: '00000000-0000-0000-0000-000000000301',
    payload: {
      name: 'workflow.flow.detected',
      incidentId: '00000000-0000-0000-0000-000000000101',
    },
    status: 'pending',
    retryCount: 0,
    createdAt: new Date('2026-07-10T08:00:00.000Z'),
  };

  it('delegates to the first supporting handler', async () => {
    const handler: OutboxHandler = {
      supports: jest.fn(() => true),
      handle: jest.fn(async (): Promise<{ kind: 'success' }> => ({
        kind: 'success',
      })),
    };
    const processor = new OutboxProcessor({ handlers: [handler] });

    const result = await processor.process(message);

    expect(result).toEqual({ kind: 'success' });
    expect(handler.handle).toHaveBeenCalledWith(message);
  });

  it('returns failure when no handler supports the message', async () => {
    const handler: OutboxHandler = {
      supports: jest.fn(() => false),
      handle: jest.fn(),
    };
    const processor = new OutboxProcessor({ handlers: [handler] });

    const result = await processor.process(message);

    expect(result).toEqual({
      kind: 'failure',
      error: `No outbox handler supports message ${message.id}.`,
    });
    expect(handler.handle).not.toHaveBeenCalled();
  });

  it('propagates handler failures', async () => {
    const handler: OutboxHandler = {
      supports: jest.fn(() => true),
      handle: jest.fn(async (): Promise<{ kind: 'failure'; error: string }> => ({
        kind: 'failure',
        error: 'Handler failed.',
      })),
    };
    const processor = new OutboxProcessor({ handlers: [handler] });

    const result = await processor.process(message);

    expect(result).toEqual({
      kind: 'failure',
      error: 'Handler failed.',
    });
  });
});
