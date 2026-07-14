# Changelog

Todos los cambios importantes de EdificiOS se documentan aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/).

---

## [0.18.0-alpha] - 2026-07-13

**Release Candidate.** Primera versión demostrable de punta a punta: backend operativo + cliente web funcional. Sin nuevas capacidades de dominio ni endpoints.

### Added

#### Sprint 18 — Frontend Foundation (PR1)

- Carpeta `frontend/` con Vite + React 19 + TypeScript + React Router + TanStack Query + Tailwind CSS v4 + Axios.
- Estructura: `src/app/`, `pages/`, `layouts/`, `components/`, `api/`, `hooks/`, `auth/`, `types/`, `routes/`, `toast/`, `utils/`.
- Clientes HTTP: `publicApiClient` y `authenticatedApiClient` (`/api/v1`); proxy de desarrollo Vite → `localhost:3000`.
- JWT en cliente: `authToken.ts`, `AuthContext`, interceptor Bearer en requests autenticados.
- Rutas: `/` (Home), `/login`, `/dashboard` (protegida), `/incidents/:incidentId`.
- `ProtectedRoute` — redirige a `/login` si no hay token; preserva ruta de destino.
- Layouts: `AppLayout` (Sidebar + Header responsive), `AuthLayout`.
- Componentes base: `Button`, `Card`, `Section`, `PageTitle`, `Container`.

#### Sprint 18 — Dashboard UI (PR2)

- `GET /api/v1/operations/dashboard` consumido vía `useDashboard()` (TanStack Query).
- `DashboardPage`: `Dashboard Summary`, `Activity Feed`, `Notifications`.
- Componentes: `DashboardMetricCard`, `ActivityFeedList/Item`, `NotificationList/Item`.

#### Sprint 18 — Incident Details UI (PR3)

- `GET /api/v1/operations/incidents/:id` y `GET /api/v1/operations/incidents/:incidentId/timeline`.
- `IncidentDetailsPage` con `IncidentHeader`, `IncidentSummaryCard`, `Timeline`, `TimelineItem`, `TimelineIcon`, `TimelineDate`.
- Hooks: `useIncident()`, `useIncidentTimeline()`.
- Navegación desde Activity Feed vía `resolveIncidentIdForFeedEntry.ts` (correlación con `recentIncidents`).

#### Sprint 18 — UX Polish (PR4)

- Skeletons reutilizables: `Skeleton`, `SkeletonCard`, `SkeletonList`, `SkeletonTimeline`, `DashboardMetricsSkeleton`.
- `EmptyState` + `EmptyStateIcon` — icono, título y descripción por sección.
- `ErrorCard` — título, descripción amigable y botón Reintentar; sin JSON crudo.
- `parseApiError` — RFC 9457 Problem Details → mensajes legibles.
- Sistema de Toasts: `toastStore` + `ToastContainer` (éxito, error, info); login, logout, errores de red, reintentos.
- Responsive: Sidebar colapsable, Dashboard en grid, Timeline y Cards adaptados a móvil.
- Accesibilidad básica: `focus-visible`, `aria-label`, contraste en botones y navegación.
- Consistencia visual: `SectionTitle`, espaciados, tipografía y paleta unificados en todas las pantallas.

#### Sprint 18 — Release Candidate (PR5)

- Versión del proyecto: `0.18.0-alpha` (`package.json`, `frontend/package.json`, `ApplicationConfig`).
- Sprint 18 marcado como COMPLETADO en `docs/05_current_status.md`.
- Glosario: conceptos de presentación (Frontend, ProtectedRoute, Skeleton, ErrorCard, Toast, Problem Details UI, etc.).
- `docs/architecture_reviews/sprint_18_frontend_foundation.md` (Architecture Review).
- `docs/architecture_backlog.md`: deuda real del frontend (login, refresh, paginación, filtros, tests UI).

### Changed

- `ApplicationConfig.version` alineada a `0.18.0-alpha` (antes desactualizada respecto a documentación).
- `tsconfig.build.json` excluye `frontend/` para que `nest build` no compile el cliente React.
- Pantallas Home, Login, Dashboard e Incident Details usan skeletons, empty states y `ErrorCard` en lugar de loaders simples.
- Interceptor Axios muestra toast automático en errores de red.

### Removed

- `Loader.tsx`, `dashboard/EmptyState.tsx`, `dashboard/ErrorState.tsx` — reemplazados por componentes compartidos en PR4.

---

## [0.17.0-alpha] - 2026-07-13

### Added

#### Sprint 17 — Authentication Query API (operativo)

- `GET /api/v1/authentication/users/:id` → `AuthenticatedUserView` (Sprint 16 PR2; confirmado operativo en Sprint 17).
- `GetAuthenticatedUserUseCase`, `UserQueryRepository`, `PostgresUserQueryRepository`.

#### Sprint 17 — User Creation (operativo)

- `POST /api/v1/authentication/users` → `{ userId }` (201) (Sprint 16 PR3; confirmado operativo en Sprint 17).
- `CreateUserUseCase`, `UserPersistence`, `PostgresUserRepository`.

#### Sprint 17 — AuthenticationContext (PR2)

- Puerto `AuthenticationContext` (`getCurrentUserId(): string | null`) sin cambios de contrato.
- `JWTAuthenticationContext` — lee `Authorization: Bearer`, valida JWT, extrae claim `userId`; devuelve `null` si falla (sin excepciones).
- `AuthenticationJwtModule` (`@nestjs/jwt`); configuración JWT desde `ApplicationConfig` (`jwtSecret`, `jwtIssuer`, `jwtAudience`, `jwtExpiration`).
- `AuthenticationHttpContext` + `AuthenticationContextMiddleware` (AsyncLocalStorage) para propagar el header por request.

#### Sprint 17 — JwtAuthenticationGuard (PR3)

- `JwtAuthenticationGuard` — depende solo de `AuthenticationContext`; lanza `UnauthorizedException` si `getCurrentUserId()` es `null`.
- `GET /api/v1/authentication/me` protegido con `@UseGuards(JwtAuthenticationGuard)`.
- Endpoints públicos sin cambios: `POST /users`, `GET /users/:id`, Operations, Health, Info, Swagger.

#### Sprint 17 — Swagger Bearer Authentication (PR4)

- Esquema OpenAPI Bearer (`type: http`, `scheme: bearer`, `bearerFormat: JWT`).
- Descripción del esquema: `Authorization: Bearer <token>`.
- `GET /api/v1/authentication/me` documentado como protegido; descripción *"Requires a valid Bearer JWT."*
- Endpoints públicos documentados con `security: []`.

#### Sprint 17 — Documentación y cierre (PR5)

- Sprint 17 marcado como COMPLETADO en `docs/05_current_status.md`.
- Glosario: `JWTAuthenticationContext`, `JwtAuthenticationGuard`, Bearer Authentication, JWT; tabla comparativa de responsabilidades.
- `docs/architecture_reviews/sprint_17_authentication.md` (Architecture Review).
- `docs/architecture_backlog.md`: Stub Authentication y JWT Authentication resueltos; deuda Sprint 17 (refresh, passwords, login, roles, permisos, políticas).

### Changed

- `StubAuthenticationContext` eliminado; `AUTHENTICATION_CONTEXT` registra `JWTAuthenticationContext`.
- Autenticación JWT operativa en runtime para `GET /me`; sin login, emisión de tokens ni autorización por roles.
- `GetCurrentUserUseCase` y lógica del controller sin cambios funcionales; guard y contexto JWT en Infrastructure.

### Removed

- `StubAuthenticationContext` y export `STUB_USER_ID`.

---

## [0.16.0-alpha] - 2026-07-13

### Added

#### Sprint 16 — Authentication Query Model (PR1)

- Módulo independiente `src/authentication/` (application, infrastructure, persistence).
- `AuthenticatedUserView`, puerto `UserQueryRepository`, `PostgresUserQueryRepository`.
- `GetAuthenticatedUserUseCase` — delegación al repositorio de lectura.
- Tabla `users` (`001_users.sql`); migración en módulo Authentication.
- `AuthenticationModule` autocontenido; sin dependencias desde Operations.

#### Sprint 16 — HTTP Query API (PR2)

- `GET /api/v1/authentication/users/:id` → `AuthenticatedUserView`.
- `AuthenticatedUserController` + `GetAuthenticatedUserParamsPipe` (UUID, trim, lowercase).
- 404 cuando el usuario no existe; validación HTTP en pipe.

#### Sprint 16 — Create User (PR3)

- `POST /api/v1/authentication/users` → `{ userId }` (201).
- `CreateUserUseCase`, puerto `UserPersistence`, `PostgresUserRepository`, `UserRecord`.
- CQRS: repositorio de escritura separado del query repository.
- `CreateUserRequestPipe` — email/displayName obligatorios, trim, email lowercase.

#### Sprint 16 — Current User + Authentication Context (PR4)

- Puerto `AuthenticationContext` (`getCurrentUserId()`).
- `StubAuthenticationContext` — stub fijo `11111111-1111-1111-1111-111111111111` (sin JWT ni headers).
- `GetCurrentUserUseCase` — context → query → `AuthenticatedUserView` o 401.
- `GET /api/v1/authentication/me` — usuario actual vía contexto.

#### Sprint 16 — Documentación y cierre (PR5)

- Sprint 16 marcado como COMPLETADO en `docs/05_current_status.md`.
- Sección **Authentication Architecture** en estado del proyecto.
- Glosario: Authentication Context, Authenticated User, Current User, User Query/Command Model, Stub Authentication.
- `docs/architecture_reviews/sprint_16_authentication_foundation.md` (Architecture Review).

### Changed

- Bounded context **Authentication** operativo: query model, command model, HTTP APIs y contexto preparado para JWT (Sprint 17).
- `scripts/migrate.js` aplica migraciones de Operations y Authentication.
- `docs/architecture_backlog.md`: ítems resueltos (Query API, Create User, Authentication Context); deuda Sprint 16 (JWT, passwords, login, refresh, authorization).

---

## [0.15.0-alpha] - 2026-07-13

### Added

#### Sprint 15 — Problem Details (PR1)

- Respuesta de errores unificada según **RFC 9457** (`application/problem+json`).
- `ProblemDetails` en `src/shared/http/problem-details.ts`: `type`, `title`, `status`, `detail`, `instance`, `correlationId`.
- `ProblemDetailsFilter` global: transforma `NotFoundException`, `BadRequestException`, `ConflictException`, `ForbiddenException`, `InternalServerErrorException`.
- URLs estables de error (`https://api.edificios/errors/...`); `correlationId` desde `CorrelationIdProvider`; `instance` = `request.url`.

#### Sprint 15 — Global HTTP Validation (PR2)

- `HttpValidationPipe` global en `src/shared/http/`: validación HTTP compartida para toda la API.
- Helpers en `http-validation.ts`: Content-Type JSON, rechazo de body `null` y payloads no-objeto.
- Convive con Request Pipes específicos (se ejecutan después); GET sin body no se valida.

#### Sprint 15 — Swagger / OpenAPI (PR3)

- Documentación automática en `GET /api/docs` (Swagger UI) y `GET /api/docs-json` (OpenAPI JSON).
- `@nestjs/swagger` + enriquecimiento en `src/shared/http/swagger/`: todos los endpoints Operations, Health, Info.
- DTOs HTTP con `@ApiProperty`; respuestas de error documentadas como Problem Details; esquema Bearer preparado (sin auth en MVP).

#### Sprint 15 — Application Configuration Module (PR4)

- `ApplicationConfig` en `src/config/`: `name`, `version`, `environment`, `apiPrefix`, `swaggerPath`.
- `ApplicationConfigModule` global (`@Global()`); independiente de Operations.
- Integración en `GetApiInfoUseCase` y `setupSwagger`; valores iniciales `0.15.0-alpha`, `/api/v1`, `/api/docs`.

#### Sprint 15 — Documentación y cierre (PR5)

- Sprint 15 marcado como COMPLETADO en `docs/05_current_status.md`.
- Sección **API Platform** en estado del proyecto.
- Glosario: Problem Details, RFC 9457, HTTP Validation, Swagger, OpenAPI, ApplicationConfig.
- `docs/architecture_reviews/sprint_15_api_platform.md` (Architecture Review).

### Changed

- Plataforma HTTP transversal consolidada: validación global → pipes de ruta → Problem Details en errores → documentación OpenAPI → configuración centralizada.
- `GET /api/v1/info` expone `name`, `version` y `environment` desde `ApplicationConfig` (`EdificiOS API`, `0.15.0-alpha`).
- `docs/architecture_backlog.md` con deuda futura Sprint 15 (auth, rate limiting, env config, SDKs OpenAPI).

---

## [0.14.0-alpha] - 2026-07-11

### Added

#### Sprint 14 — Correlation ID (PR1)

- `CorrelationIdProvider` en `src/shared/` con `AsyncLocalStorage`.
- `CorrelationIdMiddleware` global: genera UUID por request, header `x-correlation-id`.
- Disponible para Application vía `CorrelationIdProvider.get()`.

#### Sprint 14 — Correlation ID propagation (PR2)

- Propagación del `correlationId` del request a Event Log (`events.correlation_id`) y Outbox (`outbox.correlation_id`).
- Migración `010_outbox_correlation_id.sql`.
- Use cases Incident (detect, assign, start, resolve) reutilizan el UUID del request; sin generar IDs nuevos.

#### Sprint 14 — Application Logger (PR3)

- `ApplicationLogger` en `src/shared/logging/`: logs estructurados `{ timestamp, level, correlationId, message }`.
- Dependencias: `CorrelationIdProvider`, `Clock`. Sin reemplazar el logger de Nest.
- Use cases Incident: INFO al inicio y éxito; ERROR en excepciones.

#### Sprint 14 — Application Metrics (PR4)

- `ApplicationMetrics` en `src/shared/metrics/`: contadores en memoria (`increment`, `get`, `snapshot`, `reset`).
- Métricas Incident: `incident.{detect|assign|start|resolve}.{success|failure}`.
- Use cases Incident incrementan success/failure sin alterar lógica de negocio.

#### Sprint 14 — Documentación y cierre (PR5)

- Sprint 14 marcado como COMPLETADO en `docs/05_current_status.md`.
- Sección **Observability** en estado del proyecto.
- Glosario: Correlation ID, Application Logger, Structured Log, Application Metrics, Tracing, Observability.
- `docs/architecture_reviews/sprint_14_observability.md` (Architecture Review).

### Changed

- Observabilidad transversal consolidada en `SharedModule`: tracing (Correlation ID), logging estructurado y métricas en memoria.
- Trazabilidad end-to-end: request HTTP → Application → Event Log + Outbox con mismo `correlationId`.
- `docs/architecture_backlog.md` con deuda futura Sprint 14 (Prometheus, OpenTelemetry, Grafana, métricas Notification).

---

## [0.13.0-alpha] - 2026-07-11

### Added

#### Sprint 13 — Dashboard Summary (PR1)

- `DashboardSummary` en `DashboardView`: totales operativos (`totalSites`, `totalAssets`, `activeShifts`, `openIncidents`, `inProgressIncidents`, `resolvedToday`, `openWorkOrders`, `completedToday`, `pendingNotifications`).
- Cálculo en `GetOperationsDashboardUseCase` desde datos ya cargados; sin SQL nuevo.

#### Sprint 13 — Activity Feed (PR2)

- `ActivityFeedEntry` y `activityFeed` en `DashboardView`.
- Merge de `recentEvents`, `recentIncidents`, `recentWorkOrders`, `recentNotifications`; orden DESC; máximo 20 entradas.
- Tipos: `EVENT`, `INCIDENT`, `WORK_ORDER`, `NOTIFICATION`.

#### Sprint 13 — Health Module (PR3)

- Módulo independiente `src/health/` (fuera del bounded context Operations).
- `GetHealthUseCase`: `SELECT 1` sobre `PostgresOperationsPool` existente + `Clock`.
- `GET /api/v1/health` → `{ status, timestamp, version, checks: { database, operations } }`.

#### Sprint 13 — API Info Module (PR4)

- Módulo independiente `src/info/` (sin dependencias, sin PostgreSQL).
- `GetApiInfoUseCase`: metadatos constantes del sistema.
- `GET /api/v1/info` → `{ name, version, environment, boundedContext, architecture }`.

#### Sprint 13 — Documentación y cierre (PR5)

- Sprint 13 marcado como COMPLETADO en `docs/05_current_status.md`.
- Glosario: Health Check, API Info, Dashboard Summary, Activity Feed.
- `docs/architecture_reviews/sprint_13_operational_endpoints.md` (Architecture Review).

### Changed

- Dashboard operacional enriquecido con `summary` y `activityFeed` sin modificar dominio ni query repositories.
- Endpoints transversales (`/health`, `/info`) separados de `OperationsModule`; solo Health reutiliza el pool PostgreSQL exportado.
- `docs/architecture_backlog.md` con deuda real Sprint 13 (versión, environment, readiness, métricas, paginación feed, optimización summary).

---

## [0.12.0-alpha] - 2026-07-11

### Added

#### Sprint 12 — Notification Read Model (PR1)

- `NotificationView`, `NotificationQueryRepository` (`findById`, `findByRecipient`, `findRecent`).
- Mapper `NotificationRecord` / fila SQL → `NotificationView`.
- `GetNotificationByIdUseCase`, `ListNotificationsUseCase` (delegación pura al query repository).

#### Sprint 12 — HTTP Query API (PR2)

- `NotificationQueryController` independiente de `NotificationsController` (Commands / Queries).
- `GET /api/v1/operations/notifications/:id` → `NotificationView` (404 si no existe).
- `GET /api/v1/operations/actors/:actorId/notifications` → `NotificationView[]` (orden `createdAt` DESC).

#### Sprint 12 — Dashboard por Actor (PR3)

- `DashboardView.notifications`: notificaciones del Actor consultado vía `findByRecipient()`.
- `GET /api/v1/operations/dashboard?actorId={uuid}` carga `notifications`; sin `actorId` → `[]`.

#### Sprint 12 — Timeline enriquecido (PR4)

- `GetIncidentTimelineUseCase` integra `NotificationQueryRepository.findRecent(100)`.
- Entradas adicionales tipo `NOTIFICATION` para `INCIDENT_DETECTED`, `INCIDENT_ASSIGNED`, `INCIDENT_RESOLVED`.
- Merge cronológico ASC con timeline existente; mismo DTO `TimelineEntryView`.

#### Sprint 12 — Documentación y cierre (PR5)

- Sección **Notification Read Model** en `docs/05_current_status.md`.
- Glosario ampliado: Notification vs Timeline Entry vs Event Log.
- `docs/architecture_reviews/sprint_12_notification_queries.md` (Architecture Review).

### Changed

- CQRS ligero consolidado: escritura (`NotificationRepository` + `CreateNotificationUseCase`) separada de lectura (`NotificationQueryRepository` + query use cases).
- Dashboard, Timeline y HTTP Query reutilizan el mismo `NotificationQueryRepository` sin SQL nuevo.
- `docs/architecture_backlog.md` actualizado; ítems resueltos de Sprint 11 (query API, read model por Actor).

---

## [0.11.0-alpha] - 2026-07-11

### Added

#### Sprint 11 — Automatización operacional (PR1)

- `AssignIncidentUseCase` crea Notification automáticamente tras asignación exitosa (`INCIDENT_ASSIGNED`, canal `IN_APP`).

#### Sprint 11 — WorkOrder notifications (PR2)

- `StartWorkOrderUseCase` crea Notification automáticamente tras inicio exitoso (`WORK_ORDER_STARTED`, canal `IN_APP`).

#### Sprint 11 — WorkOrder notifications (PR3)

- `CompleteWorkOrderUseCase` crea Notification automáticamente tras completado exitoso (`WORK_ORDER_COMPLETED`, canal `IN_APP`).

#### Sprint 11 — Incident resolve notification (PR4)

- `ResolveIncidentUseCase` crea Notification automáticamente tras resolución exitosa (`INCIDENT_RESOLVED`, canal `IN_APP`).
- `recipientId` desde proyección del Incident (`assignedActorId ?? actorId`); integración post-transacción.

#### Sprint 11 — Documentación y cierre (PR5)

- Sección **Notification Lifecycle** en `docs/05_current_status.md`.
- Glosario actualizado con los cinco tipos de Notification operativos.
- `docs/architecture_reviews/sprint_11_notifications.md` (Architecture Review).

### Changed

- Ciclo operativo de notificaciones completo: detect, assign, start/complete WorkOrder, resolve Incident.
- Todas las integraciones viven exclusivamente en Application; `CreateNotificationUseCase` como punto único de creación.
- `docs/architecture_backlog.md` con deuda futura Sprint 11 (templates, canales, query, read model, READ).

### Nota

- La notificación al detectar Incident (`INCIDENT_DETECTED`) se introdujo en Sprint 9 PR4; Sprint 11 completa el ciclo con las cuatro integraciones restantes.

---

## [0.10.0-alpha] - 2026-07-10

### Added

#### Sprint 10 — Timeline Query Model (PR1)

- `TimelineEntryView`, `IncidentTimelineView` y puerto `IncidentTimelineRepository`.
- `PostgresIncidentTimelineRepository`: timeline desde `events`, `event_evidences`, `work_orders`, `notifications` (sin replay ni proyección).

#### Sprint 10 — GetIncidentTimelineUseCase (PR2)

- `GetIncidentTimelineUseCase`: delegación pura al repositorio de timeline.

#### Sprint 10 — HTTP Timeline (PR3)

- Endpoint `GET /api/v1/operations/incidents/:incidentId/timeline` → array de entradas `{ timestamp, type, description, actorId }`.

#### Sprint 10 — Dashboard Integration (PR4)

- Query repositories: `EventQueryRepository`, `WorkOrderQueryRepository`, `NotificationQueryRepository` con `findRecent()`.
- Dashboard extendido: `recentEvents`, `recentIncidents`, `recentWorkOrders`, `recentNotifications`.

### Changed

- `GetOperationsDashboardUseCase` reutiliza query repositories existentes y nuevos.
- Glosario con término `Timeline`.
- `docs/05_current_status.md` con Sprint 10 cerrado.
- `docs/architecture_reviews/sprint_10_timeline.md` (Architecture Review).

---

## [0.9.0-alpha] - 2026-07-10

### Added

#### Sprint 9 — Notification (PR1)

- Agregado `NotificationAggregate` inmutable con estados `PENDING`, `SENT`, `FAILED`, `READ`.
- Value Objects: `NotificationId`, `NotificationType`, `NotificationStatus`, `NotificationChannel`, `NotificationMessage`, `NotificationRecipient`.

#### Sprint 9 — NotificationRepository (PR2)

- Puerto `NotificationRepository` con `save()`, `findById()`, `findByRecipient()`.
- Persistencia `notifications` (migración `009_notifications.sql`).

#### Sprint 9 — CreateNotificationUseCase (PR3)

- `CreateNotificationUseCase` para crear y persistir notificaciones.

#### Sprint 9 — Integración Incident → Notification (PR4)

- `DetectIncidentUseCase` crea Notification automáticamente tras detección exitosa (`INCIDENT_DETECTED`, canal `IN_APP`).
- Resolución de `recipientId` desde proyección (`assignedActorId ?? actorId`); fuera de la transacción Incident.

#### Sprint 9 — HTTP Notification (PR5)

- Endpoint `POST /api/v1/operations/notifications`.

### Changed

- Glosario actualizado con término `Notification`.
- `docs/05_current_status.md` con Sprint 9 cerrado y estado integrado de todos los módulos.
- `docs/architecture_backlog.md` con deuda futura de Notification (lectura, mark as read, delivery).

---

## [0.7.0-alpha] - 2026-07-10

### Added

#### Sprint 8 — WorkOrder

- Agregado `WorkOrderAggregate` inmutable con ciclo `OPEN → IN_PROGRESS → COMPLETED` y cancelación.
- Value Objects: `WorkOrderId`, `IncidentId`, `WorkOrderStatus`, `WorkOrderDescription`, `CreatedAt`.
- Persistencia `work_orders` (migración `008_work_orders.sql`).
- Casos de uso: `CreateWorkOrderUseCase`, `StartWorkOrderUseCase`, `CompleteWorkOrderUseCase`, `CancelWorkOrderUseCase`, `GetWorkOrderByIdUseCase`, `ListWorkOrdersByIncidentUseCase`.
- Endpoints HTTP de WorkOrder y listado por Incident.
- Errores de dominio: `WorkOrderNotFoundError`, `OpenWorkOrderAlreadyExistsError`, `IncidentNotFoundError`.

#### Sprint 8 — Integración Incident ↔ WorkOrder (PR5)

- `CreateWorkOrderFromIncidentUseCase`: un Incident puede generar WorkOrders sin acoplar agregados.
- Resolución de `actorId` desde la proyección del Incident (`assignedActorId ?? actorId`).
- Endpoint `POST /api/v1/operations/incidents/:incidentId/work-orders` (solo `description` en body).
- Incident no conoce WorkOrder; la relación vive en Application.

### Changed

- Glosario actualizado con término `WorkOrder` y cadena operativa Incident → WorkOrder.
- `docs/05_current_status.md` con Sprint 8 cerrado.

---

## [0.6.0-alpha] - 2026-07-10

### Added

#### Sprint 6 — Integración Actor ↔ Incident (PR5)

- `DetectIncidentUseCase` resuelve `actorId` desde el Actor del Shift activo; el cliente no lo envía.
- Proyección de Incident incluye `actorId` junto a `assetId` y `shiftId`.
- `IncidentAggregate.detect()` y `rehydrate()` persisten el Actor de detección.

### Changed

- Flujo de detección: Asset → Site → Shift activo → Actor del Shift → `Incident.detect()`.
- Field Stories 001 y 005 actualizadas con Actor resuelto desde el Turno.

---

## [0.5.0-alpha] - 2026-07-10

### Added

#### Sprint 5 — Site

- Agregado `SiteAggregate` inmutable con VOs: `SiteId`, `SiteName`, `Address`, `TimeZone`, `BuildingType`.
- Persistencia `sites` (migración `006_sites.sql`).
- Casos de uso: `RegisterSiteUseCase`, `GetSiteByIdUseCase`, `ListSitesUseCase`.
- Endpoints HTTP de Site.
- Integración Asset → Site: registro de Asset exige Site existente.
- Error de dominio: `SiteNotFoundError`.
- ADR-007: Site como agregado explícito.

### Changed

- `AssetAggregate` referencia `SiteId` del bounded context Site.
- `RegisterAssetUseCase` valida existencia del Site antes de persistir.
- Field Stories 001, 004, 005 y 006 actualizadas con Site explícito.
- `AssetsController` traduce `SiteNotFoundError` a HTTP 404.

---

## [0.4.0-alpha] - 2026-07-10

### Added

#### Sprint 4 — Shift

- Agregado `ShiftAggregate` con ciclo `OPEN → CLOSED`.
- Domain Events: `shift.continuity.started`, `shift.continuity.closed`.
- Persistencia `shifts` (migración `005_shifts.sql`).
- Casos de uso: `StartShiftUseCase`, `CloseShiftUseCase`, `GetActiveShiftUseCase`.
- Endpoints HTTP de Shift.
- Regla: un solo Shift activo por Site.

#### Sprint 4 — Integración Shift ↔ Incident

- `DetectIncidentUseCase` exige Shift activo del Site del Asset.
- Incident asociado a `shiftId` en proyección.
- Errores de dominio: `NoActiveShiftError`, rechazo sin turno activo.

### Changed

- `DetectIncidentUseCase` resuelve Site desde el Asset y valida continuidad operativa.
- Field Stories 001, 004, 005 y 006 actualizadas con Shift activo.

---

## [0.3.0-alpha] - 2026-07-09

### Added

#### Sprint 3 — Asset

- Agregado `AssetAggregate` inmutable.
- Persistencia `assets` (migración `004_assets.sql`).
- Endpoints HTTP de Asset.
- Integración Incident → Asset: detección exige Asset existente.

---

## [0.2.0-alpha] - 2026-07-09

### Added

#### Sprint 0 — Walking Skeleton

- Monolito modular NestJS + Fastify.
- Agregado `Incident` con detección inicial.
- Domain Events, Event Log append-only, Outbox y proyección `incidents`.
- Persistencia transaccional PostgreSQL (`pg` directo, sin ORM).
- Endpoint `POST /api/v1/operations/incidents`.
- Tests de integración del walking skeleton.

#### Sprint 1 — Incident Lifecycle

- Ciclo de vida completo: `DETECTED → ASSIGNED → IN_PROGRESS → RESOLVED`.
- Domain Events por transición: `workflow.flow.detected`, `.assigned`, `.execution_started`, `.resolved`.
- Casos de uso: detect, assign, start, resolve.
- Endpoints HTTP del ciclo de vida.
- Replay del agregado desde Event Log.
- Guards P0: exactamente un DomainEvent por transición; `updateProjection` verifica `rowCount`.

#### Sprint 2 — Evidence

- Entidad `Evidence` con Value Objects (`StorageReference`, `MimeType`, `EvidenceId`, `ActorId`, `EvidenceCaption`, `CapturedAt`).
- Evidence independiente de Incident (prueba física capturada en turno).
- Persistencia de metadata (`evidences`) y almacenamiento local (`LocalFileStorage`).
- SHA-256 para integridad del archivo.
- Tabla puente `event_evidences` (hecho observado ↔ prueba física).
- `CaptureEvidenceUseCase`.
- Endpoint `POST /api/v1/operations/events/:eventId/evidence` (multipart).
- ADR-006: Evidence respalda Domain Events, no Incident.

### Documentation

- Architecture Decision Records (ADR-001 a ADR-006).
- Field Stories actualizadas con ciclo de vida y `workflow.flow.resolved`.
- `docs/05_current_status.md`, `CHANGELOG.md`, `README.md`.

---

## [0.1.0-alpha] - 2026-07-07

### Added

- Repositorio inicial.
- Estructura Clean Architecture en bounded context `operations`.
- Migración `001_initial.sql`.
