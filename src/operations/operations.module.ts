import { Module } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { GetOperationsDashboardUseCase } from './application/get-operations-dashboard-use-case';
import { GetIncidentByIdUseCase } from './application/get-incident-by-id-use-case';
import { ListEvidenceByEventUseCase } from './application/list-evidence-by-event-use-case';
import { ListIncidentsUseCase } from './application/list-incidents-use-case';
import { AssignIncidentUseCase } from './application/assign-incident-use-case';
import {
  CaptureEvidenceUseCase,
  sha256HashCalculator,
} from './application/capture-evidence-use-case';
import { DetectIncidentUseCase } from './application/detect-incident-use-case';
import { GetActorByIdUseCase } from './application/get-actor-by-id-use-case';
import { ListActorsBySiteUseCase } from './application/list-actors-by-site-use-case';
import { GetAssetByIdUseCase } from './application/get-asset-by-id-use-case';
import { GetWorkOrderByIdUseCase } from './application/get-work-order-by-id-use-case';
import { TransactionRunner } from './application/incident-persistence';
import { ListAssetsBySiteUseCase } from './application/list-assets-by-site-use-case';
import { ListWorkOrdersByIncidentUseCase } from './application/list-work-orders-by-incident-use-case';
import { RegisterActorUseCase } from './application/register-actor-use-case';
import { RegisterAssetUseCase } from './application/register-asset-use-case';
import { ResolveIncidentUseCase } from './application/resolve-incident-use-case';
import { CloseShiftUseCase } from './application/close-shift-use-case';
import { CompleteWorkOrderUseCase } from './application/complete-work-order-use-case';
import { CancelWorkOrderUseCase } from './application/cancel-work-order-use-case';
import { CreateWorkOrderUseCase } from './application/create-work-order-use-case';
import { CreateWorkOrderFromIncidentUseCase } from './application/create-work-order-from-incident-use-case';
import { GetActiveShiftUseCase } from './application/get-active-shift-use-case';
import { GetSiteByIdUseCase } from './application/get-site-by-id-use-case';
import { ListSitesUseCase } from './application/list-sites-use-case';
import { RegisterSiteUseCase } from './application/register-site-use-case';
import { StartShiftUseCase } from './application/start-shift-use-case';
import { StartWorkOrderUseCase } from './application/start-work-order-use-case';
import { StartIncidentUseCase } from './application/start-incident-use-case';
import { AssignIncidentRequestPipe } from './infrastructure/http/assign-incident-request.pipe';
import { ActorsController } from './infrastructure/http/actors.controller';
import { AssetsController } from './infrastructure/http/assets.controller';
import { CaptureEvidenceMultipartPipe } from './infrastructure/http/capture-evidence-multipart.pipe';
import { DashboardController } from './infrastructure/http/dashboard.controller';
import { DetectIncidentRequestPipe } from './infrastructure/http/detect-incident-request.pipe';
import { GetIncidentByIdParamsPipe } from './infrastructure/http/get-incident-by-id-params.pipe';
import { ListIncidentsQueryPipe } from './infrastructure/http/list-incidents-query.pipe';
import { EventsController } from './infrastructure/http/events.controller';
import { ListEvidenceByEventParamsPipe } from './infrastructure/http/list-evidence-by-event-params.pipe';
import { IncidentsController } from './infrastructure/http/incidents.controller';
import { IncidentQueryController } from './infrastructure/http/incident-query.controller';
import { IncidentWorkOrdersController } from './infrastructure/http/incident-work-orders.controller';
import { RegisterActorRequestPipe } from './infrastructure/http/register-actor-request.pipe';
import { RegisterAssetRequestPipe } from './infrastructure/http/register-asset-request.pipe';
import { RegisterSiteRequestPipe } from './infrastructure/http/register-site-request.pipe';
import { ShiftsController } from './infrastructure/http/shifts.controller';
import { SitesController } from './infrastructure/http/sites.controller';
import { StartShiftRequestPipe } from './infrastructure/http/start-shift-request.pipe';
import { CreateWorkOrderRequestPipe } from './infrastructure/http/create-work-order-request.pipe';
import { CreateWorkOrderFromIncidentRequestPipe } from './infrastructure/http/create-work-order-from-incident-request.pipe';
import { GetWorkOrderByIdParamsPipe } from './infrastructure/http/get-work-order-by-id-params.pipe';
import { ListWorkOrdersByIncidentParamsPipe } from './infrastructure/http/list-work-orders-by-incident-params.pipe';
import { WorkOrdersController } from './infrastructure/http/work-orders.controller';
import { LocalFileStorage } from './infrastructure/file-storage/local-file-storage';
import { PostgresActorRepository } from './infrastructure/persistence/postgres-actor-repository';
import { PostgresAssetRepository } from './infrastructure/persistence/postgres-asset-repository';
import { PostgresEventEvidenceRepository } from './infrastructure/persistence/postgres-event-evidence-repository';
import { PostgresEvidenceQueryRepository } from './infrastructure/persistence/postgres-evidence-query-repository';
import { PostgresEvidenceRepository } from './infrastructure/persistence/postgres-evidence-repository';
import { PostgresIncidentQueryRepository } from './infrastructure/persistence/postgres-incident-query-repository';
import { PostgresOperationsPool } from './infrastructure/persistence/postgres-operations-pool';
import { PostgresOperationsTransactionRunner } from './infrastructure/persistence/postgres-operations-transaction-runner';
import { PostgresShiftRepository } from './infrastructure/persistence/postgres-shift-repository';
import { PostgresSiteRepository } from './infrastructure/persistence/postgres-site-repository';
import { PostgresWorkOrderRepository } from './infrastructure/persistence/postgres-work-order-repository';

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
    IncidentQueryController,
    DashboardController,
    EventsController,
    ActorsController,
    AssetsController,
    SitesController,
    ShiftsController,
    WorkOrdersController,
    IncidentWorkOrdersController,
  ],
  providers: [
    DetectIncidentRequestPipe,
    AssignIncidentRequestPipe,
    ListIncidentsQueryPipe,
    GetIncidentByIdParamsPipe,
    ListEvidenceByEventParamsPipe,
    CaptureEvidenceMultipartPipe,
    RegisterAssetRequestPipe,
    RegisterActorRequestPipe,
    RegisterSiteRequestPipe,
    StartShiftRequestPipe,
    CreateWorkOrderRequestPipe,
    CreateWorkOrderFromIncidentRequestPipe,
    GetWorkOrderByIdParamsPipe,
    ListWorkOrdersByIncidentParamsPipe,
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
      provide: PostgresSiteRepository,
      inject: [PostgresOperationsPool],
      useFactory: (operationsPool: PostgresOperationsPool) =>
        new PostgresSiteRepository(operationsPool.pool),
    },
    {
      provide: PostgresActorRepository,
      inject: [PostgresOperationsPool],
      useFactory: (operationsPool: PostgresOperationsPool) =>
        new PostgresActorRepository(operationsPool.pool),
    },
    {
      provide: PostgresWorkOrderRepository,
      inject: [PostgresOperationsPool],
      useFactory: (operationsPool: PostgresOperationsPool) =>
        new PostgresWorkOrderRepository(operationsPool.pool),
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
      provide: PostgresEvidenceQueryRepository,
      inject: [PostgresOperationsPool],
      useFactory: (operationsPool: PostgresOperationsPool) =>
        new PostgresEvidenceQueryRepository(operationsPool.pool),
    },
    {
      provide: ListEvidenceByEventUseCase,
      inject: [PostgresEvidenceQueryRepository],
      useFactory: (evidenceQueryRepository: PostgresEvidenceQueryRepository) =>
        new ListEvidenceByEventUseCase({
          evidenceQueryRepository,
        }),
    },
    {
      provide: PostgresIncidentQueryRepository,
      inject: [PostgresOperationsPool],
      useFactory: (operationsPool: PostgresOperationsPool) =>
        new PostgresIncidentQueryRepository(operationsPool.pool),
    },
    {
      provide: GetIncidentByIdUseCase,
      inject: [PostgresIncidentQueryRepository],
      useFactory: (incidentQueryRepository: PostgresIncidentQueryRepository) =>
        new GetIncidentByIdUseCase({
          incidentQueryRepository,
        }),
    },
    {
      provide: ListIncidentsUseCase,
      inject: [PostgresIncidentQueryRepository, PostgresAssetRepository],
      useFactory: (
        incidentQueryRepository: PostgresIncidentQueryRepository,
        assetRepository: PostgresAssetRepository,
      ) =>
        new ListIncidentsUseCase({
          incidentQueryRepository,
          assetRepository,
        }),
    },
    {
      provide: GetOperationsDashboardUseCase,
      inject: [
        PostgresSiteRepository,
        PostgresAssetRepository,
        PostgresShiftRepository,
        PostgresIncidentQueryRepository,
      ],
      useFactory: (
        siteRepository: PostgresSiteRepository,
        assetRepository: PostgresAssetRepository,
        shiftRepository: PostgresShiftRepository,
        incidentQueryRepository: PostgresIncidentQueryRepository,
      ) =>
        new GetOperationsDashboardUseCase({
          siteRepository,
          assetRepository,
          shiftRepository,
          incidentQueryRepository,
          clock: {
            now: () => new Date(),
          },
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
      inject: [PostgresAssetRepository, PostgresSiteRepository],
      useFactory: (
        assetRepository: PostgresAssetRepository,
        siteRepository: PostgresSiteRepository,
      ) =>
        new RegisterAssetUseCase({
          assetRepository,
          siteRepository,
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
      inject: [PostgresShiftRepository, PostgresActorRepository],
      useFactory: (
        shiftRepository: PostgresShiftRepository,
        actorRepository: PostgresActorRepository,
      ) =>
        new StartShiftUseCase({
          shiftRepository,
          actorRepository,
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
    {
      provide: RegisterSiteUseCase,
      inject: [PostgresSiteRepository],
      useFactory: (siteRepository: PostgresSiteRepository) =>
        new RegisterSiteUseCase({
          siteRepository,
          idGenerator: {
            generate: () => randomUUID(),
          },
        }),
    },
    {
      provide: GetSiteByIdUseCase,
      inject: [PostgresSiteRepository],
      useFactory: (siteRepository: PostgresSiteRepository) =>
        new GetSiteByIdUseCase({
          siteRepository,
        }),
    },
    {
      provide: ListSitesUseCase,
      inject: [PostgresSiteRepository],
      useFactory: (siteRepository: PostgresSiteRepository) =>
        new ListSitesUseCase({
          siteRepository,
        }),
    },
    {
      provide: RegisterActorUseCase,
      inject: [PostgresActorRepository],
      useFactory: (actorRepository: PostgresActorRepository) =>
        new RegisterActorUseCase({
          actorRepository,
          idGenerator: {
            generate: () => randomUUID(),
          },
        }),
    },
    {
      provide: GetActorByIdUseCase,
      inject: [PostgresActorRepository],
      useFactory: (actorRepository: PostgresActorRepository) =>
        new GetActorByIdUseCase({
          actorRepository,
        }),
    },
    {
      provide: ListActorsBySiteUseCase,
      inject: [PostgresActorRepository],
      useFactory: (actorRepository: PostgresActorRepository) =>
        new ListActorsBySiteUseCase({
          actorRepository,
        }),
    },
    {
      provide: CreateWorkOrderUseCase,
      inject: [
        PostgresWorkOrderRepository,
        PostgresActorRepository,
        PostgresIncidentQueryRepository,
      ],
      useFactory: (
        workOrderRepository: PostgresWorkOrderRepository,
        actorRepository: PostgresActorRepository,
        incidentQueryRepository: PostgresIncidentQueryRepository,
      ) =>
        new CreateWorkOrderUseCase({
          workOrderRepository,
          actorRepository,
          incidentQueryRepository,
          idGenerator: {
            generate: () => randomUUID(),
          },
          clock: {
            now: () => new Date(),
          },
        }),
    },
    {
      provide: CreateWorkOrderFromIncidentUseCase,
      inject: [PostgresIncidentQueryRepository, CreateWorkOrderUseCase],
      useFactory: (
        incidentQueryRepository: PostgresIncidentQueryRepository,
        createWorkOrderUseCase: CreateWorkOrderUseCase,
      ) =>
        new CreateWorkOrderFromIncidentUseCase({
          incidentQueryRepository,
          createWorkOrderUseCase,
        }),
    },
    {
      provide: StartWorkOrderUseCase,
      inject: [PostgresWorkOrderRepository],
      useFactory: (workOrderRepository: PostgresWorkOrderRepository) =>
        new StartWorkOrderUseCase({
          workOrderRepository,
        }),
    },
    {
      provide: CompleteWorkOrderUseCase,
      inject: [PostgresWorkOrderRepository],
      useFactory: (workOrderRepository: PostgresWorkOrderRepository) =>
        new CompleteWorkOrderUseCase({
          workOrderRepository,
        }),
    },
    {
      provide: CancelWorkOrderUseCase,
      inject: [PostgresWorkOrderRepository],
      useFactory: (workOrderRepository: PostgresWorkOrderRepository) =>
        new CancelWorkOrderUseCase({
          workOrderRepository,
        }),
    },
    {
      provide: GetWorkOrderByIdUseCase,
      inject: [PostgresWorkOrderRepository],
      useFactory: (workOrderRepository: PostgresWorkOrderRepository) =>
        new GetWorkOrderByIdUseCase({
          workOrderRepository,
        }),
    },
    {
      provide: ListWorkOrdersByIncidentUseCase,
      inject: [PostgresWorkOrderRepository],
      useFactory: (workOrderRepository: PostgresWorkOrderRepository) =>
        new ListWorkOrdersByIncidentUseCase({
          workOrderRepository,
        }),
    },
  ],
})
export class OperationsModule {}
