import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { OutboxDispatcher } from '../../application/outbox-dispatcher';

const DEFAULT_POLL_INTERVAL_MS = 5_000;

@Injectable()
export class OutboxDispatcherRunner implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly outboxDispatcher: OutboxDispatcher) {}

  onModuleInit(): void {
    if (process.env.OUTBOX_DISPATCHER_ENABLED === 'false') {
      return;
    }

    if (process.env.NODE_ENV === 'test') {
      return;
    }

    this.timer = setInterval(() => {
      void this.outboxDispatcher.dispatch();
    }, DEFAULT_POLL_INTERVAL_MS);

    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
