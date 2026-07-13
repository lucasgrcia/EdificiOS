import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class PostgresAuthenticationPool implements OnModuleDestroy {
  readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
