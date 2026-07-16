import { Module } from '@nestjs/common';

import { ApplicationConfig } from '../config/application-config';
import { OperationsModule } from '../operations/operations.module';
import { PostgresOperationsPool } from '../operations/infrastructure/persistence/postgres-operations-pool';
import { GetHealthUseCase } from './application/get-health-use-case';
import { HealthController } from './infrastructure/http/health.controller';

@Module({
  imports: [OperationsModule],
  controllers: [HealthController],
  providers: [
    {
      provide: GetHealthUseCase,
      inject: [PostgresOperationsPool, ApplicationConfig],
      useFactory: (
        operationsPool: PostgresOperationsPool,
        applicationConfig: ApplicationConfig,
      ) =>
        new GetHealthUseCase({
          pool: operationsPool.pool,
          clock: {
            now: () => new Date(),
          },
          applicationConfig,
        }),
    },
  ],
})
export class HealthModule {}
