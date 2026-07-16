import { OutboxHandler, OutboxHandlerResult } from './outbox-handler';
import { OutboxMessage } from './outbox-message';

export type OutboxProcessorDependencies = {
  handlers: OutboxHandler[];
};

export class OutboxProcessor {
  constructor(private readonly dependencies: OutboxProcessorDependencies) {}

  async process(message: OutboxMessage): Promise<OutboxHandlerResult> {
    const handler = this.dependencies.handlers.find((candidate) =>
      candidate.supports(message),
    );

    if (handler === undefined) {
      return {
        kind: 'failure',
        error: `No outbox handler supports message ${message.id}.`,
      };
    }

    return handler.handle(message);
  }
}
