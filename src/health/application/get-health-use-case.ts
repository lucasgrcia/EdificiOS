import { Pool } from 'pg';

import { HealthView } from './health-view';

const HEALTH_VERSION = '0.13.0-alpha';

export type Clock = {
  now(): Date;
};

export type GetHealthUseCaseDependencies = {
  pool: Pool;
  clock: Clock;
};

export class GetHealthUseCase {
  constructor(private readonly dependencies: GetHealthUseCaseDependencies) {}

  async execute(): Promise<HealthView> {
    await this.dependencies.pool.query('SELECT 1');

    return {
      status: 'UP',
      timestamp: this.dependencies.clock.now().toISOString(),
      version: HEALTH_VERSION,
      checks: {
        database: 'UP',
        operations: 'UP',
      },
    };
  }
}
