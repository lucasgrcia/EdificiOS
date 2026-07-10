import { Module } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { AssignIncidentUseCase } from './application/assign-incident-use-case';
import {
  CaptureEvidenceUseCase,
  sha256HashCalculator,
} from './application/capture-evidence-use-case';
import { DetectIncidentUseCase } from './application/detect-incident-use-case';
import { GetAssetByIdUseCase } from './application/get-asset-by-id-use-case';
import { TransactionRunner } from './application/incident-persistence';
import { ListAssetsBySiteUseCase } from './application/list-assets-by-site-use-case';
import { RegisterAssetUseCase } from './application/register-asset-use-case';
import { ResolveIncidentUseCase } from './application/resolve-incident-use-case';
import { CloseShiftUseCase } from './application/close-shift-use-case';
import { GetActiveShiftUseCase } from './application/get-active-shift-use-case';
import { StartShiftUseCase } from './application/start-shift-use-case';
import { StartIncidentUseCase } from './application/start-incident-use-case';
import { AssignIncidentRequestPipe } from './infrastructure/http/assign-incident-request.pipe';
import { AssetsController } from './infrastructure/http/assets.controller';
import { CaptureEvidenceMultipartPipe } from './infrastructure/http/capture-evidence-multipart.pipe';
import { DetectIncidentRequestPipe } from './infrastructure/http/detect-incident-request.pipe';
import { EventsController } from './infrastructure/http/events.controller';
import { IncidentsController } from './infrastructure/http/incidents.controller';
import { RegisterAssetRequestPipe } from './infrastructure/http/register-asset-request.pipe';
import { ShiftsController } from './infrastructure/http/shifts.controller';
import { SitesController } from './infrastructure/http/sites.controller';
import { StartShiftRequestPipe } from './infrastructure/http/start-shift-request.pipe';
import { LocalFileStorage } from './infrastructure/file-storage/local-file-storage';
import { PostgresAssetRepository } from './infrastructure/persistence/postgres-asset-repository';
import { PostgresEventEvidenceRepository } from './infrastructure/persistence/postgres-event-evidence-repository';
import { PostgresEvidenceRepository } from './infrastructure/persistence/postgres-evidence-repository';
import { PostgresOperationsPool } from './infrastructure/persistence/postgres-operations-pool';
import { PostgresOperationsTransactionRunner } from './infrastructure/persistence/postgres-operations-transaction-runner';
import { PostgresShiftRepository } from './infrastructure/persistence/postgres-shift-repository';

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
  controllers: [
    IncidentsController,
    EventsController,
    AssetsController,
    SitesController,
    ShiftsController,
  ],
  providers: [
    DetectIncidentRequestPipe,
    AssignIncidentRequestPipe,
    CaptureEvidenceMultipartPipe,
    RegisterAssetRequestPipe,
    StartShiftRequestPipe,
    PostgresOperationsPool,
    PostgresOperationsTransactionRunner,
    {
      provide: PostgresEvidenceRepository,
      inject: [PostgresOperationsPool],
      useFactory: (operationsPool: PostgresOperationsPool) =>
        new PostgresEvidenceRepository(operationsPool.pool),
    },
    {
      provide: PostgresAssetRepository,
      inject: [PostgresOperationsPool],
      useFactory: (operationsPool: PostgresOperationsPool) =>
        new PostgresAssetRepository(operationsPool.pool),
    },
    {
      provide: PostgresShiftRepository,
      inject: [PostgresOperationsPool],
      useFactory: (operationsPool: PostgresOperationsPool) =>
        new PostgresShiftRepository(operationsPool.pool),
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
      inject: [
        PostgresOperationsTransactionRunner,
        PostgresAssetRepository,
        PostgresShiftRepository,
      ],
      useFactory: (
        transactionRunner: TransactionRunner,
        assetRepository: PostgresAssetRepository,
        shiftRepository: PostgresShiftRepository,
      ) =>
        new DetectIncidentUseCase({
          ...createUseCaseDependencies(transactionRunner),
          assetRepository,
          shiftRepository,
        }),
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
    {
      provide: CaptureEvidenceUseCase,
      inject: [
        LocalFileStorage,
        PostgresEvidenceRepository,
        PostgresEventEvidenceRepository,
      ],
      useFactory: (
        fileStorage: LocalFileStorage,
        evidenceRepository: PostgresEvidenceRepository,
        eventEvidenceRepository: PostgresEventEvidenceRepository,
      ) =>
        new CaptureEvidenceUseCase({
          fileStorage,
          evidenceRepository,
          eventEvidenceRepository,
          idGenerator: {
            generate: () => randomUUID(),
          },
          clock: {
            now: () => new Date(),
          },
          hashCalculator: sha256HashCalculator,
        }),
    },
    {
      provide: RegisterAssetUseCase,
      inject: [PostgresAssetRepository],
      useFactory: (assetRepository: PostgresAssetRepository) =>
        new RegisterAssetUseCase({
          assetRepository,
          idGenerator: {
            generate: () => randomUUID(),
          },
        }),
    },
    {
      provide: GetAssetByIdUseCase,
      inject: [PostgresAssetRepository],
      useFactory: (assetRepository: PostgresAssetRepository) =>
        new GetAssetByIdUseCase({
          assetRepository,
        }),
    },
    {
      provide: ListAssetsBySiteUseCase,
      inject: [PostgresAssetRepository],
      useFactory: (assetRepository: PostgresAssetRepository) =>
        new ListAssetsBySiteUseCase({
          assetRepository,
        }),
    },
    {
      provide: StartShiftUseCase,
      inject: [PostgresShiftRepository],
      useFactory: (shiftRepository: PostgresShiftRepository) =>
        new StartShiftUseCase({
          shiftRepository,
          idGenerator: {
            generate: () => randomUUID(),
          },
          clock: {
            now: () => new Date(),
          },
        }),
    },
    {
      provide: CloseShiftUseCase,
      inject: [PostgresShiftRepository],
      useFactory: (shiftRepository: PostgresShiftRepository) =>
        new CloseShiftUseCase({
          shiftRepository,
          idGenerator: {
            generate: () => randomUUID(),
          },
          clock: {
            now: () => new Date(),
          },
        }),
    },
    {
      provide: GetActiveShiftUseCase,
      inject: [PostgresShiftRepository],
      useFactory: (shiftRepository: PostgresShiftRepository) =>
        new GetActiveShiftUseCase({
          shiftRepository,
        }),
    },
  ],
})
export class OperationsModule {}
