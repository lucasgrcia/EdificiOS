import { Module } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import {
  DetectIncidentUseCase,
  TransactionRunner,
} from './application/detect-incident-use-case';
import { IncidentsController } from './infrastructure/http/incidents.controller';
import { DetectIncidentRequestPipe } from './infrastructure/http/detect-incident-request.pipe';
import { PostgresOperationsPool } from './infrastructure/persistence/postgres-operations-pool';
import { PostgresOperationsTransactionRunner } from './infrastructure/persistence/postgres-operations-transaction-runner';

@Module({
  controllers: [IncidentsController],
  providers: [
    DetectIncidentRequestPipe,
    PostgresOperationsPool,
    PostgresOperationsTransactionRunner,
    {
      provide: DetectIncidentUseCase,
      inject: [PostgresOperationsTransactionRunner],
      useFactory: (transactionRunner: TransactionRunner) =>
        new DetectIncidentUseCase({
          transactionRunner,
          idGenerator: {
            generate: () => randomUUID(),
          },
          clock: {
            now: () => new Date(),
          },
        }),
    },
  ],
})
export class OperationsModule {}
