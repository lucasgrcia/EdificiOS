import { Module } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { GetOperationsDashboardUseCase } from './application/get-operations-dashboard-use-case';
import { GetNotificationByIdUseCase } from './application/get-notification-by-id-use-case';
import { GetIncidentByIdUseCase } from './application/get-incident-by-id-use-case';
import { GetIncidentTimelineUseCase } from './application/get-incident-timeline-use-case';
import { ListEvidenceByEventUseCase } from './application/list-evidence-by-event-use-case';
import { ListNotificationsUseCase } from './application/list-notifications-use-case';
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
import { CreateNotificationUseCase } from './application/create-notification-use-case';
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
import { GetNotificationByIdParamsPipe } from './infrastructure/http/get-notification-by-id-params.pipe';
import { GetIncidentByIdParamsPipe } from './infrastructure/http/get-incident-by-id-params.pipe';
import { ListNotificationsByActorParamsPipe } from './infrastructure/http/list-notifications-by-actor-params.pipe';
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
import { CreateNotificationRequestPipe } from './infrastructure/http/create-notification-request.pipe';
import { NotificationQueryController } from './infrastructure/http/notification-query.controller';
import { NotificationsController } from './infrastructure/http/notifications.controller';
import { WorkOrdersController } from './infrastructure/http/work-orders.controller';
import { LocalFileStorage } from './infrastructure/file-storage/local-file-storage';
import { PostgresActorRepository } from './infrastructure/persistence/postgres-actor-repository';
import { PostgresAssetRepository } from './infrastructure/persistence/postgres-asset-repository';
import { PostgresEventEvidenceRepository } from './infrastructure/persistence/postgres-event-evidence-repository';
import { PostgresEventQueryRepository } from './infrastructure/persistence/postgres-event-query-repository';
import { PostgresEvidenceQueryRepository } from './infrastructure/persistence/postgres-evidence-query-repository';
import { PostgresEvidenceRepository } from './infrastructure/persistence/postgres-evidence-repository';
import { PostgresIncidentQueryRepository } from './infrastructure/persistence/postgres-incident-query-repository';
import { PostgresIncidentTimelineRepository } from './infrastructure/persistence/postgres-incident-timeline-repository';
import { PostgresOperationsPool } from './infrastructure/persistence/postgres-operations-pool';
import { PostgresOperationsTransactionRunner } from './infrastructure/persistence/postgres-operations-transaction-runner';
import { PostgresShiftRepository } from './infrastructure/persistence/postgres-shift-repository';
import { PostgresSiteRepository } from './infrastructure/persistence/postgres-site-repository';
import { PostgresWorkOrderRepository } from './infrastructure/persistence/postgres-work-order-repository';
import { PostgresWorkOrderQueryRepository } from './infrastructure/persistence/postgres-work-order-query-repository';
import { PostgresNotificationRepository } from './infrastructure/persistence/postgres-notification-repository';
import { PostgresNotificationQueryRepository } from './infrastructure/persistence/postgres-notification-query-repository';
import { CorrelationIdProvider } from '../shared/correlation-id';
import { ApplicationLogger } from '../shared/logging/application-logger';
import { ApplicationMetrics } from '../shared/metrics/application-metrics';

function createUseCaseDependencies(
  transactionRunner: TransactionRunner,
  correlationIdProvider: CorrelationIdProvider,
  logger: ApplicationLogger,
  metrics: ApplicationMetrics,
) {
  return {
    transactionRunner,
    idGenerator: {
      generate: () => randomUUID(),
    },
    clock: {
      now: () => new Date(),
    },
    correlationIdProvider,
    logger,
    metrics,
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
    NotificationsController,
    NotificationQueryController,
  ],
  providers: [
    DetectIncidentRequestPipe,
    AssignIncidentRequestPipe,
    ListIncidentsQueryPipe,
    GetIncidentByIdParamsPipe,
    GetNotificationByIdParamsPipe,
    ListNotificationsByActorParamsPipe,
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
    CreateNotificationRequestPipe,
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
      provide: PostgresNotificationRepository,
      inject: [PostgresOperationsPool],
      useFactory: (operationsPool: PostgresOperationsPool) =>
        new PostgresNotificationRepository(operationsPool.pool),
    },
    {
      provide: CreateNotificationUseCase,
      inject: [PostgresNotificationRepository],
      useFactory: (notificationRepository: PostgresNotificationRepository) =>
        new CreateNotificationUseCase({
          notificationRepository,
          idGenerator: {
            generate: () => randomUUID(),
          },
          clock: {
            now: () => new Date(),
          },
        }),
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
      provide: PostgresIncidentTimelineRepository,
      inject: [PostgresOperationsPool],
      useFactory: (operationsPool: PostgresOperationsPool) =>
        new PostgresIncidentTimelineRepository(operationsPool.pool),
    },
    {
      provide: PostgresIncidentTimelineRepository,
      inject: [PostgresOperationsPool],
      useFactory: (operationsPool: PostgresOperationsPool) =>
        new PostgresIncidentTimelineRepository(operationsPool.pool),
    },
    {
      provide: GetIncidentTimelineUseCase,
      inject: [
        PostgresIncidentTimelineRepository,
        PostgresNotificationQueryRepository,
      ],
      useFactory: (
        incidentTimelineRepository: PostgresIncidentTimelineRepository,
        notificationQueryRepository: PostgresNotificationQueryRepository,
      ) =>
        new GetIncidentTimelineUseCase({
          incidentTimelineRepository,
          notificationQueryRepository,
        }),
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
      provide: GetNotificationByIdUseCase,
      inject: [PostgresNotificationQueryRepository],
      useFactory: (
        notificationQueryRepository: PostgresNotificationQueryRepository,
      ) =>
        new GetNotificationByIdUseCase({
          notificationQueryRepository,
        }),
    },
    {
      provide: ListNotificationsUseCase,
      inject: [PostgresNotificationQueryRepository],
      useFactory: (
        notificationQueryRepository: PostgresNotificationQueryRepository,
      ) =>
        new ListNotificationsUseCase({
          notificationQueryRepository,
        }),
    },
    {
      provide: PostgresEventQueryRepository,
      inject: [PostgresOperationsPool],
      useFactory: (operationsPool: PostgresOperationsPool) =>
        new PostgresEventQueryRepository(operationsPool.pool),
    },
    {
      provide: PostgresWorkOrderQueryRepository,
      inject: [PostgresOperationsPool],
      useFactory: (operationsPool: PostgresOperationsPool) =>
        new PostgresWorkOrderQueryRepository(operationsPool.pool),
    },
    {
      provide: PostgresNotificationQueryRepository,
      inject: [PostgresOperationsPool],
      useFactory: (operationsPool: PostgresOperationsPool) =>
        new PostgresNotificationQueryRepository(operationsPool.pool),
    },
    {
      provide: GetOperationsDashboardUseCase,
      inject: [
        PostgresSiteRepository,
        PostgresAssetRepository,
        PostgresShiftRepository,
        PostgresIncidentQueryRepository,
        PostgresEventQueryRepository,
        PostgresWorkOrderQueryRepository,
        PostgresNotificationQueryRepository,
      ],
      useFactory: (
        siteRepository: PostgresSiteRepository,
        assetRepository: PostgresAssetRepository,
        shiftRepository: PostgresShiftRepository,
        incidentQueryRepository: PostgresIncidentQueryRepository,
        eventQueryRepository: PostgresEventQueryRepository,
        workOrderQueryRepository: PostgresWorkOrderQueryRepository,
        notificationQueryRepository: PostgresNotificationQueryRepository,
      ) =>
        new GetOperationsDashboardUseCase({
          siteRepository,
          assetRepository,
          shiftRepository,
          incidentQueryRepository,
          eventQueryRepository,
          workOrderQueryRepository,
          notificationQueryRepository,
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
        CreateNotificationUseCase,
        CorrelationIdProvider,
        ApplicationLogger,
        ApplicationMetrics,
      ],
      useFactory: (
        transactionRunner: TransactionRunner,
        assetRepository: PostgresAssetRepository,
        shiftRepository: PostgresShiftRepository,
        createNotificationUseCase: CreateNotificationUseCase,
        correlationIdProvider: CorrelationIdProvider,
        logger: ApplicationLogger,
        metrics: ApplicationMetrics,
      ) =>
        new DetectIncidentUseCase({
          ...createUseCaseDependencies(
            transactionRunner,
            correlationIdProvider,
            logger,
            metrics,
          ),
          assetRepository,
          shiftRepository,
          createNotificationUseCase,
        }),
    },
    {
      provide: AssignIncidentUseCase,
      inject: [
        PostgresOperationsTransactionRunner,
        CreateNotificationUseCase,
        CorrelationIdProvider,
        ApplicationLogger,
        ApplicationMetrics,
      ],
      useFactory: (
        transactionRunner: TransactionRunner,
        createNotificationUseCase: CreateNotificationUseCase,
        correlationIdProvider: CorrelationIdProvider,
        logger: ApplicationLogger,
        metrics: ApplicationMetrics,
      ) =>
        new AssignIncidentUseCase({
          ...createUseCaseDependencies(
            transactionRunner,
            correlationIdProvider,
            logger,
            metrics,
          ),
          createNotificationUseCase,
        }),
    },
    {
      provide: StartIncidentUseCase,
      inject: [
        PostgresOperationsTransactionRunner,
        CorrelationIdProvider,
        ApplicationLogger,
        ApplicationMetrics,
      ],
      useFactory: (
        transactionRunner: TransactionRunner,
        correlationIdProvider: CorrelationIdProvider,
        logger: ApplicationLogger,
        metrics: ApplicationMetrics,
      ) =>
        new StartIncidentUseCase(
          createUseCaseDependencies(
            transactionRunner,
            correlationIdProvider,
            logger,
            metrics,
          ),
        ),
    },
    {
      provide: ResolveIncidentUseCase,
      inject: [
        PostgresOperationsTransactionRunner,
        CreateNotificationUseCase,
        CorrelationIdProvider,
        ApplicationLogger,
        ApplicationMetrics,
      ],
      useFactory: (
        transactionRunner: TransactionRunner,
        createNotificationUseCase: CreateNotificationUseCase,
        correlationIdProvider: CorrelationIdProvider,
        logger: ApplicationLogger,
        metrics: ApplicationMetrics,
      ) =>
        new ResolveIncidentUseCase({
          ...createUseCaseDependencies(
            transactionRunner,
            correlationIdProvider,
            logger,
            metrics,
          ),
          createNotificationUseCase,
        }),
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
      inject: [PostgresWorkOrderRepository, CreateNotificationUseCase],
      useFactory: (
        workOrderRepository: PostgresWorkOrderRepository,
        createNotificationUseCase: CreateNotificationUseCase,
      ) =>
        new StartWorkOrderUseCase({
          workOrderRepository,
          createNotificationUseCase,
        }),
    },
    {
      provide: CompleteWorkOrderUseCase,
      inject: [PostgresWorkOrderRepository, CreateNotificationUseCase],
      useFactory: (
        workOrderRepository: PostgresWorkOrderRepository,
        createNotificationUseCase: CreateNotificationUseCase,
      ) =>
        new CompleteWorkOrderUseCase({
          workOrderRepository,
          createNotificationUseCase,
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
  exports: [PostgresOperationsPool],
})
export class OperationsModule {}
