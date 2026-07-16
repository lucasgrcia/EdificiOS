import { Injectable } from '@nestjs/common';

import { ApplicationLogger } from '../../../shared/logging/application-logger';
import {
  OutboxHandler,
  OutboxHandlerResult,
} from '../../application/outbox-handler';
import { OutboxMessage } from '../../application/outbox-message';

const NOTIFICATION_EVENT_NAMES = new Set([
  'workflow.flow.detected',
  'workflow.flow.assigned',
  'workflow.flow.execution_started',
  'workflow.flow.resolved',
]);

function readEventName(payload: Record<string, unknown>): string | null {
  const eventName = payload.name;

  return typeof eventName === 'string' ? eventName : null;
}

@Injectable()
export class NotificationOutboxHandler implements OutboxHandler {
  constructor(private readonly logger: ApplicationLogger) {}

  supports(message: OutboxMessage): boolean {
    const eventName = readEventName(message.payload);

    return eventName !== null && NOTIFICATION_EVENT_NAMES.has(eventName);
  }

  async handle(message: OutboxMessage): Promise<OutboxHandlerResult> {
    const eventName = readEventName(message.payload);

    if (eventName === null) {
      return {
        kind: 'failure',
        error: `Outbox message ${message.id} is missing event name.`,
      };
    }

    this.logger.info(
      `Outbox notification handler processed message ${message.id} for event ${eventName}`,
    );

    return { kind: 'success' };
  }
}
