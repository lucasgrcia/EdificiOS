import { Pool } from 'pg';

import { ApplicationConfig } from '../../config/application-config';
import { HealthView } from './health-view';

export type Clock = {
  now(): Date;
};

export type GetHealthUseCaseDependencies = {
  pool: Pool;
  clock: Clock;
  applicationConfig: ApplicationConfig;
};

export class GetHealthUseCase {
  constructor(private readonly dependencies: GetHealthUseCaseDependencies) {}

  async execute(): Promise<HealthView> {
    await this.dependencies.pool.query('SELECT 1');

    return {
      status: 'UP',
      timestamp: this.dependencies.clock.now().toISOString(),
      version: this.dependencies.applicationConfig.version,
      checks: {
        database: 'UP',
        operations: 'UP',
      },
    };
  }
}
