import { Module } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { AssignIncidentUseCase } from './application/assign-incident-use-case';
import { DetectIncidentUseCase } from './application/detect-incident-use-case';
import { TransactionRunner } from './application/incident-persistence';
import { ResolveIncidentUseCase } from './application/resolve-incident-use-case';
import { StartIncidentUseCase } from './application/start-incident-use-case';
import { AssignIncidentRequestPipe } from './infrastructure/http/assign-incident-request.pipe';
import { DetectIncidentRequestPipe } from './infrastructure/http/detect-incident-request.pipe';
import { IncidentsController } from './infrastructure/http/incidents.controller';
import { LocalFileStorage } from './infrastructure/file-storage/local-file-storage';
import { PostgresEventEvidenceRepository } from './infrastructure/persistence/postgres-event-evidence-repository';
import { PostgresEvidenceRepository } from './infrastructure/persistence/postgres-evidence-repository';
import { PostgresOperationsPool } from './infrastructure/persistence/postgres-operations-pool';
import { PostgresOperationsTransactionRunner } from './infrastructure/persistence/postgres-operations-transaction-runner';

function createUseCaseDependencies(transactionRunner: TransactionRunner) {
  return {
    transactionRunner,
    idGenerator: {
      generate: () => randomUUID(),
    },
    clock: {
      now: () => new Date(),
    },
  };
}

@Module({
  controllers: [IncidentsController],
  providers: [
    DetectIncidentRequestPipe,
    AssignIncidentRequestPipe,
    PostgresOperationsPool,
    PostgresOperationsTransactionRunner,
    {
      provide: PostgresEvidenceRepository,
      inject: [PostgresOperationsPool],
      useFactory: (operationsPool: PostgresOperationsPool) =>
        new PostgresEvidenceRepository(operationsPool.pool),
    },
    {
      provide: PostgresEventEvidenceRepository,
      inject: [PostgresOperationsPool],
      useFactory: (operationsPool: PostgresOperationsPool) =>
        new PostgresEventEvidenceRepository(operationsPool.pool),
    },
    {
      provide: LocalFileStorage,
      useFactory: () =>
        new LocalFileStorage({
          basePath: process.env.EVIDENCE_STORAGE_PATH ?? './storage/evidences',
        }),
    },
    {
      provide: DetectIncidentUseCase,
      inject: [PostgresOperationsTransactionRunner],
      useFactory: (transactionRunner: TransactionRunner) =>
        new DetectIncidentUseCase(createUseCaseDependencies(transactionRunner)),
    },
    {
      provide: AssignIncidentUseCase,
      inject: [PostgresOperationsTransactionRunner],
      useFactory: (transactionRunner: TransactionRunner) =>
        new AssignIncidentUseCase(createUseCaseDependencies(transactionRunner)),
    },
    {
      provide: StartIncidentUseCase,
      inject: [PostgresOperationsTransactionRunner],
      useFactory: (transactionRunner: TransactionRunner) =>
        new StartIncidentUseCase(createUseCaseDependencies(transactionRunner)),
    },
    {
      provide: ResolveIncidentUseCase,
      inject: [PostgresOperationsTransactionRunner],
      useFactory: (transactionRunner: TransactionRunner) =>
        new ResolveIncidentUseCase(createUseCaseDependencies(transactionRunner)),
    },
  ],
})
export class OperationsModule {}
