import { Module } from '@nestjs/common';

import { OperationsModule } from '../operations/operations.module';
import { PostgresOperationsPool } from '../operations/infrastructure/persistence/postgres-operations-pool';
import { OutboxDispatcher } from './application/outbox-dispatcher';
import { OUTBOX_HANDLERS } from './application/outbox-handler';
import { OutboxProcessor } from './application/outbox-processor';
import { NotificationOutboxHandler } from './infrastructure/handlers/notification-outbox-handler';
import { PostgresOutboxDispatchRepository } from './infrastructure/persistence/postgres-outbox-dispatch-repository';
import { OutboxDispatcherRunner } from './infrastructure/scheduler/outbox-dispatcher.runner';

const OUTBOX_BATCH_SIZE = 10;
const OUTBOX_MAX_RETRIES = 3;

@Module({
  imports: [OperationsModule],
  providers: [
    NotificationOutboxHandler,
    OutboxDispatcherRunner,
    {
      provide: OUTBOX_HANDLERS,
      inject: [NotificationOutboxHandler],
      useFactory: (notificationOutboxHandler: NotificationOutboxHandler) => [
        notificationOutboxHandler,
      ],
    },
    {
      provide: PostgresOutboxDispatchRepository,
      inject: [PostgresOperationsPool],
      useFactory: (operationsPool: PostgresOperationsPool) =>
        new PostgresOutboxDispatchRepository(operationsPool.pool),
    },
    {
      provide: OutboxProcessor,
      inject: [OUTBOX_HANDLERS],
      useFactory: (handlers: NotificationOutboxHandler[]) =>
        new OutboxProcessor({ handlers }),
    },
    {
      provide: OutboxDispatcher,
      inject: [PostgresOutboxDispatchRepository, OutboxProcessor],
      useFactory: (
        outboxDispatchRepository: PostgresOutboxDispatchRepository,
        outboxProcessor: OutboxProcessor,
      ) =>
        new OutboxDispatcher({
          outboxDispatchRepository,
          outboxProcessor,
          clock: {
            now: () => new Date(),
          },
          maxRetries: OUTBOX_MAX_RETRIES,
          batchSize: OUTBOX_BATCH_SIZE,
        }),
    },
  ],
})
export class OutboxModule {}
