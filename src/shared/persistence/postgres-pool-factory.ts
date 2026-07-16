import { Pool, PoolConfig } from 'pg';

export function resolvePostgresPoolConfig(): PoolConfig {
  return {
    connectionString: process.env.DATABASE_URL,
  };
}

export function createPostgresPool(): Pool {
  return new Pool(resolvePostgresPoolConfig());
}
