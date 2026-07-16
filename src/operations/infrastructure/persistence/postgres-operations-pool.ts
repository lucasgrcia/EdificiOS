import { Injectable, OnModuleDestroy } from '@nestjs/common';

import { createPostgresPool } from '../../../shared/persistence/postgres-pool-factory';

@Injectable()
export class PostgresOperationsPool implements OnModuleDestroy {
  readonly pool = createPostgresPool();

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
