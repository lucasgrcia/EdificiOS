import { OutboxMessage } from './outbox-message';

export type OutboxHandlerResult =
  | { kind: 'success' }
  | { kind: 'failure'; error: string };

export interface OutboxHandler {
  supports(message: OutboxMessage): boolean;
  handle(message: OutboxMessage): Promise<OutboxHandlerResult>;
}

export const OUTBOX_HANDLERS = Symbol('OUTBOX_HANDLERS');
