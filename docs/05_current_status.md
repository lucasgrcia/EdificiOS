# Estado actual del proyecto

Última actualización: 2026-07-13

Sprint 18 — cerrado. **Release Candidate `0.18.0-alpha`.**

---

## Resumen

| Indicador | Estado |
|-----------|--------|
| Desarrollo | Activo |
| Arquitectura | Estable |
| Walking Skeleton | Completo |
| Release Candidate | `0.18.0-alpha` — demostrable E2E |
| Backend tests | 621/621 OK |
| Backend build | OK |
| Frontend build | OK |

---

## Estado actual

El sistema posee **ocho agregados operativos** en el bounded context `operations` y **un bounded context `authentication`** independiente:

| Módulo | Rol | Integración |
|--------|-----|-------------|
| **Incident** | Detección y ciclo de vida de incidencias | Asset, Shift, Actor; genera WorkOrder y Notification |
| **Evidence** | Prueba física asociada a Domain Events | Event Log |
| **Asset** | Activos del edificio | Site; requerido para detección |
| **Shift** | Continuidad operativa por Site | Site; requerido para detección |
| **Site** | Edificio explícito | Asset, Shift, Actor |
| **Actor** | Persona operativa | Shift, Incident (resolución en detección) |
| **WorkOrder** | Orden de trabajo derivada de Incident | Incident (Application) |
| **Notification** | Mensaje operativo + read model de consulta | Commands: `CreateNotificationUseCase`; Queries: `NotificationQueryRepository` |
| **Timeline** | Read model cronológico por Incident | `events`, `event_evidences`, `work_orders`, `notifications`; enriquecido Sprint 12 |
| **Authentication** | Identidad de usuario (query, command, JWT) | Bounded context independiente; tabla `users`; sin dependencia de Operations |

Módulos transversales: `health`, `info`, `shared`, `config`.

Cadena operativa completa:

```
Site → Asset → Shift → Actor
              ↓
         Incident (detect)
              ├── WorkOrder (opcional)
              └── Notifications automáticas (ciclo completo)
                    └── Timeline (lectura)
```

---

## Notification Lifecycle

Todas las Notifications se crean **exclusivamente desde Application**, nunca desde dominio. El patrón es siempre: persistencia exitosa → `CreateNotificationUseCase.execute()` → return.

```
Incident.detect()
        ↓
Notification INCIDENT_DETECTED

Incident.assign()
        ↓
Notification INCIDENT_ASSIGNED

WorkOrder.start()
        ↓
Notification WORK_ORDER_STARTED

WorkOrder.complete()
        ↓
Notification WORK_ORDER_COMPLETED

Incident.resolve()
        ↓
Notification INCIDENT_RESOLVED
```

| Type | Use case | Canal | Cuándo |
|------|----------|-------|--------|
| `INCIDENT_DETECTED` | `DetectIncidentUseCase` | `IN_APP` | Tras detección exitosa |
| `INCIDENT_ASSIGNED` | `AssignIncidentUseCase` | `IN_APP` | Tras asignación exitosa |
| `WORK_ORDER_STARTED` | `StartWorkOrderUseCase` | `IN_APP` | Tras inicio exitoso |
| `WORK_ORDER_COMPLETED` | `CompleteWorkOrderUseCase` | `IN_APP` | Tras completado exitoso |
| `INCIDENT_RESOLVED` | `ResolveIncidentUseCase` | `IN_APP` | Tras resolución exitosa |

Si falla cualquier validación, transición o persistencia, **no** se genera Notification.

`CreateNotificationUseCase` es el punto único de creación (manual vía HTTP o automática vía integraciones).

---

## Notification Read Model

CQRS ligero: la escritura vive en `NotificationRepository` + `CreateNotificationUseCase`; la lectura en `NotificationQueryRepository` + query use cases. Sin modificar agregados ni Event Log.

```
Notification (tabla notifications)
        ↓
NotificationQueryRepository
  ├── findById(id)
  ├── findByRecipient(recipientId)   → orden createdAt DESC
  └── findRecent(limit)              → dashboard global
        ↓
GET /api/v1/operations/notifications/:id
GET /api/v1/operations/actors/:actorId/notifications
        ↓
Dashboard (?actorId=…)  →  notifications: NotificationView[]
        ↓
Timeline (GetIncidentTimelineUseCase)
  → findRecent(100) + filtro INCIDENT_*
  → entradas type NOTIFICATION en TimelineEntryView
```

| Capa | Componente | Rol |
|------|------------|-----|
| Read model | `NotificationView` | DTO: `id`, `recipientId`, `type`, `channel`, `status`, `message`, `createdAt` |
| Query | `GetNotificationByIdUseCase` | Delegación a `findById` |
| Query | `ListNotificationsUseCase` | Delegación a `findByRecipient` |
| HTTP Query | `NotificationQueryController` | Separado de `NotificationsController` (POST) |
| Dashboard | `GetOperationsDashboardUseCase` | `notifications` si `actorId` presente; si no → `[]` |
| Timeline | `GetIncidentTimelineUseCase` | Enriquecimiento con notificaciones `INCIDENT_*` como `NOTIFICATION` |

---

## Sprints completados

### Sprint 0 — Walking Skeleton

- `IncidentAggregate` con detección.
- Domain Events, Event Log, Outbox, proyección PostgreSQL.
- Endpoint HTTP de detección.
- Tests de integración transaccional.

### Sprint 1 — Incident Lifecycle

- Ciclo `DETECTED → ASSIGNED → IN_PROGRESS → RESOLVED`.
- Un Domain Event por transición, persistido en transacción única.
- Endpoints HTTP: detect, assign, start, resolve.
- Replay del agregado desde eventos.
- Guards: un evento por transición; `updateProjection` con `rowCount`.

### Sprint 2 — Evidence

| PR | Entregable | Estado |
|----|------------|--------|
| PR1 | Dominio Evidence (VOs, entidad, tests unitarios) | ✔ |
| PR2 | Metadata PostgreSQL + `FileStorage` local | ✔ |
| PR3 | Asociación Event ↔ Evidence (`event_evidences`) | ✔ |
| PR4 | `CaptureEvidenceUseCase` | ✔ |
| PR5 | HTTP multipart capture evidence | ✔ |

### Sprint 3 — Asset

| PR | Entregable | Estado |
|----|------------|--------|
| PR1 | Dominio `AssetAggregate` | ✔ |
| PR2 | Persistencia `assets` | ✔ |
| PR3 | HTTP Asset | ✔ |
| PR4 | Integración Incident → Asset | ✔ |

### Sprint 4 — Shift

| PR | Entregable | Estado |
|----|------------|--------|
| PR1 | Dominio `ShiftAggregate` | ✔ |
| PR2 | Persistencia `shifts` | ✔ |
| PR3 | Application (start, close, get active) | ✔ |
| PR4 | HTTP Shift | ✔ |
| PR5 | Integración Shift ↔ Incident | ✔ |

### Sprint 5 — Site

| PR | Entregable | Estado |
|----|------------|--------|
| PR1 | Dominio `SiteAggregate` | ✔ |
| PR2 | Persistencia `sites` | ✔ |
| PR3 | HTTP Site | ✔ |
| PR4 | Integración Asset → Site | ✔ |
| PR5 | Revisión arquitectónica + cierre | ✔ |

### Sprint 6 — Actor

| PR | Entregable | Estado |
|----|------------|--------|
| PR1 | Dominio `ActorAggregate` | ✔ |
| PR2 | Persistencia `actors` | ✔ |
| PR3 | HTTP Actor | ✔ |
| PR4 | Integración Actor ↔ Shift | ✔ |
| PR5 | Integración Actor ↔ Incident | ✔ |

### Sprint 7 — Read Models + Dashboard

| PR | Entregable | Estado |
|----|------------|--------|
| PR1 | `IncidentQueryRepository`, read models | ✔ |
| PR2 | HTTP query incidents | ✔ |
| PR3 | Evidence query por evento | ✔ |
| PR4 | Operations Dashboard | ✔ |

### Sprint 8 — WorkOrder

| PR | Entregable | Estado |
|----|------------|--------|
| PR1 | Dominio `WorkOrderAggregate` | ✔ |
| PR2 | Persistencia `work_orders` | ✔ |
| PR3 | Application (create, start, complete, cancel) | ✔ |
| PR4 | HTTP WorkOrder | ✔ |
| PR5 | Integración Incident ↔ WorkOrder | ✔ |

### Sprint 9 — Notification

| PR | Entregable | Estado |
|----|------------|--------|
| PR1 | Dominio `NotificationAggregate` + VOs | ✔ |
| PR2 | `NotificationRepository` + persistencia PostgreSQL | ✔ |
| PR3 | `CreateNotificationUseCase` | ✔ |
| PR4 | Integración Incident → Notification | ✔ |
| PR5 | HTTP `POST /notifications` | ✔ |

### Sprint 10 — Timeline

| PR | Entregable | Estado |
|----|------------|--------|
| PR1 | Query Model `IncidentTimelineRepository` | ✔ |
| PR2 | `GetIncidentTimelineUseCase` | ✔ |
| PR3 | HTTP `GET /incidents/:incidentId/timeline` | ✔ |
| PR4 | Dashboard: últimos eventos, incidencias, órdenes, notificaciones | ✔ |
| PR5 | Documentación + Architecture Review | ✔ |

### Sprint 11 — Automatización operacional de Notifications

| PR | Entregable | Estado |
|----|------------|--------|
| PR1 | `AssignIncidentUseCase` → Notification `INCIDENT_ASSIGNED` | ✔ |
| PR2 | `StartWorkOrderUseCase` → Notification `WORK_ORDER_STARTED` | ✔ |
| PR3 | `CompleteWorkOrderUseCase` → Notification `WORK_ORDER_COMPLETED` | ✔ |
| PR4 | `ResolveIncidentUseCase` → Notification `INCIDENT_RESOLVED` | ✔ |
| PR5 | Documentación + Architecture Review | ✔ |

### Sprint 12 — Notification Queries (Read Model + HTTP + Dashboard + Timeline)

| PR | Entregable | Estado |
|----|------------|--------|
| PR1 | `NotificationView`, `NotificationQueryRepository`, query use cases | ✔ |
| PR2 | HTTP Query: `GET /notifications/:id`, `GET /actors/:actorId/notifications` | ✔ |
| PR3 | Dashboard `notifications` por `actorId` | ✔ |
| PR4 | Timeline enriquecido con entradas `NOTIFICATION` | ✔ |
| PR5 | Documentación + Architecture Review | ✔ |

### Sprint 13 — Dashboard operacional + Operational Endpoints

| PR | Entregable | Estado |
|----|------------|--------|
| PR1 | `DashboardSummary` en `GetOperationsDashboardUseCase` | ✔ |
| PR2 | `ActivityFeedEntry` + `activityFeed` (merge DESC, máx. 20) | ✔ |
| PR3 | `HealthModule` + `GET /api/v1/health` | ✔ |
| PR4 | `InfoModule` + `GET /api/v1/info` | ✔ |
| PR5 | Documentación + Architecture Review | ✔ |

### Sprint 14 — Observability (Correlation ID + Logging + Metrics)

| PR | Entregable | Estado |
|----|------------|--------|
| PR1 | `CorrelationIdProvider` + middleware HTTP global | ✔ |
| PR2 | Propagación `correlationId` → Event Log + Outbox | ✔ |
| PR3 | `ApplicationLogger` (structured logs) | ✔ |
| PR4 | `ApplicationMetrics` (contadores en memoria) | ✔ |
| PR5 | Documentación + Architecture Review | ✔ |

### Sprint 15 — API Platform (Problem Details + Validation + Swagger + Configuration)

| PR | Entregable | Estado |
|----|------------|--------|
| PR1 | RFC 9457 Problem Details + `ProblemDetailsFilter` global | ✔ |
| PR2 | `HttpValidationPipe` global + helpers HTTP | ✔ |
| PR3 | Swagger / OpenAPI (`GET /api/docs`, `/api/docs-json`) | ✔ |
| PR4 | `ApplicationConfig` + `ApplicationConfigModule` | ✔ |
| PR5 | Documentación + Architecture Review | ✔ |

### Sprint 16 — Authentication Foundation (Query + Command + Context)

| PR | Entregable | Estado |
|----|------------|--------|
| PR1 | Authentication Query Model (`UserQueryRepository`, `GetAuthenticatedUserUseCase`) | ✔ |
| PR2 | HTTP Query API (`GET /api/v1/authentication/users/:id`) | ✔ |
| PR3 | Create User (`POST /api/v1/authentication/users`, `CreateUserUseCase`) | ✔ |
| PR4 | Current User + `AuthenticationContext` stub (`GET /api/v1/authentication/me`) | ✔ |
| PR5 | Documentación + Architecture Review | ✔ |

### Sprint 17 — JWT Authentication (Context + Guard + Swagger)

| PR | Entregable | Estado |
|----|------------|--------|
| PR1 | `JWTAuthenticationContext` + `AuthenticationJwtModule` + config JWT en `ApplicationConfig` | ✔ |
| PR2 | Reemplazo de `StubAuthenticationContext` por JWT en runtime | ✔ |
| PR3 | `JwtAuthenticationGuard` en `GET /api/v1/authentication/me` | ✔ |
| PR4 | Swagger Bearer Authentication (OpenAPI) | ✔ |
| PR5 | Documentación + Architecture Review | ✔ |

### Sprint 18 — Frontend Foundation (Release Candidate)

| PR | Entregable | Estado |
|----|------------|--------|
| PR1 | Foundation: Vite + React + Router + Query + Tailwind + Axios + JWT cliente + layouts + rutas | ✔ |
| PR2 | Dashboard UI: `GET /operations/dashboard`, summary, activity feed, notifications | ✔ |
| PR3 | Incident Details UI: incident + timeline, navegación desde activity feed | ✔ |
| PR4 | UX Polish: skeletons, empty/error states, toasts, responsive, accesibilidad | ✔ |
| PR5 | Release Candidate: documentación, versión `0.18.0-alpha`, cierre sprint | ✔ |

---

## Funcionalidades implementadas

### Incident

| Operación | Endpoint | Requisito |
|-----------|----------|-----------|
| Detect | `POST /api/v1/operations/incidents` | Asset existente + Shift activo del Site |

El sistema resuelve automáticamente `actorId` desde el Actor del Shift activo. El cliente envía solo `assetId` y `description`.

Tras detección exitosa, el sistema crea automáticamente una Notification para el Actor destinatario (`assignedActorId ?? actorId`). La integración vive en Application; Incident no conoce Notification.

Tras asignación y resolución exitosas, el sistema crea Notifications automáticas (`INCIDENT_ASSIGNED`, `INCIDENT_RESOLVED`). Mismo patrón: post-transacción, vía `CreateNotificationUseCase`.

| Operación | Endpoint | Requisito |
|-----------|----------|-----------|
| Assign | `POST /api/v1/operations/incidents/:id/assign` | — |
| Start | `POST /api/v1/operations/incidents/:id/start` | — |
| Resolve | `POST /api/v1/operations/incidents/:id/resolve` | — |
| List | `GET /api/v1/operations/incidents` | — |
| Get by id | `GET /api/v1/operations/incidents/:id` | — |
| Timeline | `GET /api/v1/operations/incidents/:incidentId/timeline` | — |

La proyección de Incident incluye `assetId`, `shiftId` y `actorId` (Actor del Turno al momento de la detección).

Un Incident puede generar WorkOrders. La relación vive en Application; el agregado Incident no conoce WorkOrder.

### WorkOrder

| Operación | Endpoint | Requisito |
|-----------|----------|-----------|
| Create | `POST /api/v1/operations/work-orders` | Incident + Actor existentes; sin otro WorkOrder `OPEN` |
| Create from Incident | `POST /api/v1/operations/incidents/:incidentId/work-orders` | Incident existente; resuelve `actorId` desde proyección |
| Get by id | `GET /api/v1/operations/work-orders/:id` | — |
| List by Incident | `GET /api/v1/operations/incidents/:incidentId/work-orders` | — |
| Start | `POST /api/v1/operations/work-orders/:id/start` | Estado `OPEN`; Notification `WORK_ORDER_STARTED` automática |
| Complete | `POST /api/v1/operations/work-orders/:id/complete` | Estado `IN_PROGRESS`; Notification `WORK_ORDER_COMPLETED` automática |
| Cancel | `POST /api/v1/operations/work-orders/:id/cancel` | Estado `OPEN` o `IN_PROGRESS` |

Regla: un solo WorkOrder `OPEN` por Incident.

Cadena de integración:

```
Incident → CreateWorkOrderFromIncidentUseCase → CreateWorkOrderUseCase
```

Resolución de actor: `assignedActorId ?? actorId` desde la proyección del Incident.

Estado: **completo** (dominio, persistencia, application, HTTP e integración Incident).

Estado: **completo** (dominio, persistencia, application, HTTP, integración Incident y notificaciones automáticas start/complete).

### Notification

| Operación | Endpoint | Requisito |
|-----------|----------|-----------|
| Create | `POST /api/v1/operations/notifications` | `recipientId`, `type`, `channel`, `message` |
| Get by id | `GET /api/v1/operations/notifications/:id` | — |
| List by Actor | `GET /api/v1/operations/actors/:actorId/notifications` | — |

Notificaciones automáticas (sin endpoint adicional); todas vía `CreateNotificationUseCase` post-persistencia:

| Type | Origen | recipientId |
|------|--------|-------------|
| `INCIDENT_DETECTED` | `DetectIncidentUseCase` | `assignedActorId ?? actorId` |
| `INCIDENT_ASSIGNED` | `AssignIncidentUseCase` | Actor asignado |
| `INCIDENT_RESOLVED` | `ResolveIncidentUseCase` | `assignedActorId ?? actorId` |
| `WORK_ORDER_STARTED` | `StartWorkOrderUseCase` | `actorId` del WorkOrder |
| `WORK_ORDER_COMPLETED` | `CompleteWorkOrderUseCase` | `actorId` del WorkOrder |

Canal automático: `IN_APP`.

**Importante:** Notification representa intención persistida, no envío real (email, push, websocket). No participa del Event Log ni modifica agregados operativos.

Estados en dominio: `PENDING`, `SENT`, `FAILED`, `READ`. Sin transiciones ni mark as read.

Estado: **completo** para creación automática, persistencia, query HTTP, dashboard por Actor y enriquecimiento de Timeline; mark as read, delivery y paginación en backlog.

### Timeline

| Operación | Endpoint | Detalle |
|-----------|----------|---------|
| Get by Incident | `GET /api/v1/operations/incidents/:incidentId/timeline` | Array `{ timestamp, type, description, actorId }` |

Fuentes base: `events`, `event_evidences`, `work_orders`, `notifications` (repositorio). Sprint 12: `GetIncidentTimelineUseCase` añade entradas `NOTIFICATION` desde `findRecent(100)` filtrando tipos `INCIDENT_*`. Orden cronológico ASC. Sin replay.

Estado: **completo** (query model, use case enriquecido, HTTP, tests).

### Site

| Operación | Endpoint |
|-----------|----------|
| Register | `POST /api/v1/operations/sites` |
| Get by id | `GET /api/v1/operations/sites/:id` |
| List all | `GET /api/v1/operations/sites` |

Regla: todo Asset pertenece obligatoriamente a un Site existente.

### Asset

| Operación | Endpoint | Requisito |
|-----------|----------|-----------|
| Register | `POST /api/v1/operations/assets` | Site existente (404 si no existe) |
| Get by id | `GET /api/v1/operations/assets/:id` | — |
| List by site | `GET /api/v1/operations/sites/:siteId/assets` | — |

### Shift

| Operación | Endpoint |
|-----------|----------|
| Start | `POST /api/v1/operations/sites/:siteId/shifts/start` |
| Close | `POST /api/v1/operations/shifts/:shiftId/close` |
| Get active | `GET /api/v1/operations/sites/:siteId/shifts/active` |

Regla: un solo Shift `OPEN` por Site.

### Actor

| Operación | Endpoint |
|-----------|----------|
| Register | `POST /api/v1/operations/actors` |
| Get by id | `GET /api/v1/operations/actors/:id` |
| List by site | `GET /api/v1/operations/sites/:siteId/actors` |

### Evidence

| Capacidad | Detalle |
|-----------|---------|
| Dominio | Entidad inmutable, VOs validados |
| Integridad | SHA-256 del contenido |
| Almacenamiento | Local filesystem (`EVIDENCE_STORAGE_PATH`) |
| Metadata | Tabla `evidences` |
| Asociación | Tabla puente `event_evidences` |
| HTTP | `POST /api/v1/operations/events/:eventId/evidence` |

Mime types soportados: `image/jpeg`, `image/png`, `video/mp4`, `audio/mpeg`.

### Dashboard

| Operación | Endpoint |
|-----------|----------|
| Get dashboard | `GET /api/v1/operations/dashboard` |
| Get dashboard por Actor | `GET /api/v1/operations/dashboard?actorId={uuid}` |

Incluye: `summary` (totales operativos), totales por Site, `openIncidents`, `recentEvents`, `recentIncidents`, `recentWorkOrders`, `recentNotifications` (últimos 10), `notifications` (del Actor si `actorId` presente; si no → `[]`), `activityFeed` (últimas 20 entradas mezcladas).

**Dashboard Summary** (`summary`): `totalSites`, `totalAssets`, `activeShifts`, `openIncidents`, `inProgressIncidents`, `resolvedToday`, `openWorkOrders`, `completedToday`, `pendingNotifications`. Calculado en Application desde datos ya cargados.

**Activity Feed** (`activityFeed`): merge de eventos, incidencias, órdenes y notificaciones recientes; orden `timestamp` DESC; máximo 20 entradas. Tipos: `EVENT`, `INCIDENT`, `WORK_ORDER`, `NOTIFICATION`.

Estado: **operativo** (Sprint 7 + Sprint 10 PR4 + Sprint 12 PR3 + Sprint 13 PR1–PR2).

### Operational Endpoints

Endpoints transversales fuera del bounded context `operations`. No exponen lógica de negocio ni consultan agregados.

| Operación | Endpoint | Módulo | Detalle |
|-----------|----------|--------|---------|
| Health Check | `GET /api/v1/health` | `HealthModule` | `SELECT 1` sobre pool PostgreSQL; `checks.database` y `checks.operations` |
| API Info | `GET /api/v1/info` | `InfoModule` | Metadatos constantes; sin base de datos |

**Health** responde si el sistema puede operar (conectividad DB). **Info** describe qué es la API (nombre, versión, arquitectura). **Dashboard** resume el estado operativo del edificio (incidencias, turnos, feed de actividad).

Estado: **operativo** (Sprint 13 PR3–PR4).

### Observability

Capa transversal en `src/shared/` que permite reconstruir operaciones HTTP de punta a punta.

```
HTTP Request
    ↓
Correlation ID (middleware → CorrelationIdProvider)
    ↓
Application Logger (structured logs con correlationId)
    ↓
Application Metrics (contadores success/failure en memoria)
    ↓
Event Log (events.correlation_id)
    ↓
Outbox (outbox.correlation_id)
```

| Componente | Ubicación | Rol |
|------------|-----------|-----|
| **Correlation ID** | `src/shared/correlation-id.ts`, middleware HTTP | UUID por request; contexto ALS para Application |
| **Application Logger** | `src/shared/logging/application-logger.ts` | Logs estructurados: `{ timestamp, level, correlationId, message }` |
| **Application Metrics** | `src/shared/metrics/application-metrics.ts` | Contadores en memoria: `incident.*.{success\|failure}` |

**Propagación:** los use cases Incident (detect, assign, start, resolve) leen `correlationIdProvider.get()` y persisten el mismo UUID en Event Log y Outbox. No se generan UUID adicionales en Application.

**Logging:** INFO al inicio y al completar; ERROR en excepción. No reemplaza el logger de NestJS.

**Métricas:** 8 contadores Incident en memoria. Sin Prometheus ni exportación externa.

Estado: **operativo** (Sprint 14 PR1–PR4).

### API Platform

Capa transversal HTTP que unifica contrato de errores, validación de entrada, documentación y configuración. Vive en `src/shared/http/` y `src/config/`; no modifica dominio ni casos de uso de negocio.

```
HTTP Request
    ↓
Global Validation (HttpValidationPipe)
    ↓
Request Pipes (validación específica por endpoint)
    ↓
Controller
    ↓
Use Case
    ↓
Problem Details (ProblemDetailsFilter en errores)
    ↓
Swagger (documentación OpenAPI en /api/docs)
    ↓
ApplicationConfig (metadatos centralizados)
```

La API posee:

| Capacidad | Componente | Rol |
|-----------|------------|-----|
| **Contrato de errores unificado** | `ProblemDetailsFilter` | Toda excepción HTTP → RFC 9457 (`application/problem+json`) con `correlationId` |
| **Validación global** | `HttpValidationPipe` | Content-Type JSON, body objeto, rechazo de `null`; solo en `@Body()` |
| **Documentación OpenAPI** | `setupSwagger` + enriquecimiento | Swagger UI + JSON; DTOs, responses y Problem Details documentados |
| **Configuración centralizada** | `ApplicationConfig` | `name`, `version`, `environment`, `apiPrefix`, `swaggerPath` |

**Integración:** `ApplicationConfig` alimenta `GET /api/v1/info` y metadata Swagger. Health mantiene su versión interna (no modificado en Sprint 15).

**Endpoints de plataforma:**

| Recurso | URL |
|---------|-----|
| Swagger UI | `GET /api/docs` |
| OpenAPI JSON | `GET /api/docs-json` |
| API Info | `GET /api/v1/info` |

Estado: **operativo** (Sprint 15 PR1–PR4).

### Authentication

Módulo independiente `src/authentication/` — bounded context fuera de Operations. **Autenticación JWT operativa** para el usuario actual (`GET /me`); sin login, emisión de tokens, passwords ni autorización por roles.

| Capacidad | Estado |
|-----------|--------|
| User Query | ✔ |
| User Creation | ✔ |
| Current User | ✔ |
| JWT Authentication | ✔ |
| HTTP Guard | ✔ |
| Swagger Authentication | ✔ |

| Operación | Endpoint | Detalle |
|-----------|----------|---------|
| Get user by id | `GET /api/v1/authentication/users/:id` | `AuthenticatedUserView`; 404 si no existe; **público** |
| Create user | `POST /api/v1/authentication/users` | Body: `email`, `displayName`; 201 `{ userId }`; **público** |
| Current user | `GET /api/v1/authentication/me` | Requiere `Authorization: Bearer <JWT>`; `JwtAuthenticationGuard` + `GetCurrentUserUseCase`; 401 sin token válido |

**Tabla:** `users` (`id`, `email`, `display_name`, `status`, `created_at`). Migración `src/authentication/infrastructure/persistence/migrations/001_users.sql`.

**Config JWT:** `ApplicationConfig` — `jwtSecret`, `jwtIssuer`, `jwtAudience`, `jwtExpiration`.

Estado: **operativo** (Sprint 16 PR1–PR4 + Sprint 17 PR1–PR4).

### Authentication Architecture

Capa de identidad desacoplada de Operations. CQRS ligero: `PostgresUserQueryRepository` (lectura) y `PostgresUserRepository` (escritura) sobre la misma tabla `users`.

```
HTTP Request
    ↓
AuthenticationContextMiddleware → AuthenticationHttpContext (Authorization header)
    ↓
JwtAuthenticationGuard (solo GET /me)
    ↓
AuthenticationContext (JWTAuthenticationContext)
    ↓
Use Cases (GetAuthenticatedUser, CreateUser, GetCurrentUser)
    ↓
Repositories (UserQueryRepository / UserPersistence)
    ↓
PostgreSQL (users)
```

**Separación de responsabilidades:**

| Componente | Capa | Rol |
|------------|------|-----|
| `AuthenticationContext` | Application (puerto) | Contrato `getCurrentUserId()` |
| `JWTAuthenticationContext` | Infrastructure | Valida JWT, extrae `userId`; devuelve `null` si falla |
| `JwtAuthenticationGuard` | Infrastructure | Exige identidad en HTTP; `UnauthorizedException` si contexto es `null` |
| `GetCurrentUserUseCase` | Application | Orquesta contexto + query; sin conocer JWT ni headers |

El guard **no valida JWT** directamente — delega en `AuthenticationContext`. Operations, Health, Info y Swagger permanecen públicos en este sprint.

---

## Frontend (Release Candidate)

Cliente web en `frontend/` — capa de presentación pura. **No modifica backend ni contratos HTTP.**

| Indicador | Estado |
|-----------|--------|
| Stack | Vite + React 19 + TypeScript + React Router + TanStack Query + Tailwind v4 + Axios |
| Versión | `0.18.0-alpha` |
| Build | OK (`npm run build` en `frontend/`) |
| Proxy dev | `:5173` → `/api` → `localhost:3000` |

### Pantallas

| Pantalla | Ruta | APIs |
|----------|------|------|
| Home | `/` | `GET /api/v1/info` |
| Login | `/login` | JWT manual (sin endpoint de credenciales) |
| Dashboard | `/dashboard` | `GET /api/v1/operations/dashboard` |
| Incident Details | `/incidents/:incidentId` | `GET incidents/:id`, `GET .../timeline` |

### Arquitectura del cliente

```
Pages → Hooks (TanStack Query) → API (Axios) → Backend :3000
              ↓
        Components (UI compartida)
              ↓
        Auth (JWT localStorage) + Toast + parseApiError (RFC 9457)
```

**Rutas protegidas:** `ProtectedRoute` en `/dashboard` únicamente. Incident details es pública (Operations sin guard).

**Componentes transversales (PR4):** `SkeletonCard`, `SkeletonList`, `SkeletonTimeline`, `EmptyState`, `ErrorCard`, `ToastContainer`, `SectionTitle`.

**Limitaciones conocidas en UI:**

- Login = pegar JWT manualmente (sin flujo de credenciales).
- `priority` y `site` muestran `—` (`IncidentView` no los expone).
- Correlación Activity Feed → Incident vía heurística en `resolveIncidentIdForFeedEntry.ts`.
- Dashboard sin selector de `actorId` (notifications vacías por defecto).

**Demostración E2E:**

```bash
# Terminal 1 — backend
npm run db:setup && npm run start:dev    # :3000

# Terminal 2 — frontend
cd frontend && npm install && npm run dev   # :5173
```

Estado: **operativo** (Sprint 18 PR1–PR5). Ver `docs/architecture_reviews/sprint_18_frontend_foundation.md`.

---

## Persistencia

PostgreSQL directo (`pg`). Sin ORM. Sin Foreign Keys entre agregados.

| Tabla | Rol |
|-------|-----|
| `incidents` | Proyección del agregado Incident (`assetId`, `shiftId`, `actorId` en jsonb) |
| `events` | Event Log append-only |
| `outbox` | Mensajes pendientes de publicación |
| `evidences` | Metadata de pruebas físicas |
| `event_evidences` | Relación hecho ↔ evidencia |
| `sites` | Edificios registrados |
| `assets` | Activos del edificio (`site_id` referencia lógica) |
| `shifts` | Turnos operativos por Site |
| `actors` | Personas operativas por Site |
| `work_orders` | Órdenes de trabajo (`incident_id`, `actor_id` referencia lógica) |
| `notifications` | Intenciones de notificación (`recipient_id` referencia lógica a Actor) |
| `users` | Usuarios de Authentication (`email`, `display_name`, `status`; bounded context `authentication`) |

Migraciones en `src/operations/infrastructure/migrations/` y `src/authentication/infrastructure/persistence/migrations/`.

---

## Tests

```
63 test suites — 621 tests — 0 fallos
```

| Área | Archivos |
|------|----------|
| Dominio Site / Asset / Shift / Actor / WorkOrder / Notification | `site.spec.ts`, `asset.spec.ts`, `shift.spec.ts`, `actor.spec.ts`, `work-order.spec.ts`, `notification.spec.ts` |
| Dominio Incident | `incident-aggregate-replay.spec.ts`, `incident-p0-guards.spec.ts` |
| Dominio Evidence | `evidence.spec.ts` |
| Casos de uso | `detect-incident`, `assign-incident`, `resolve-incident`, `incident-lifecycle`, `capture-evidence`, `shift-use-cases`, `register-asset-use-case`, `work-order-use-cases`, `incident-work-order`, `create-notification`, `notification-query`, `get-incident-timeline`, `get-operations-dashboard`, `create-user` |
| HTTP | `site.http`, `asset.http`, `shift.http`, `actor.http`, `capture-evidence.http`, `incident-query.http`, `work-orders.http`, `notification.http`, `notification-query.http`, `dashboard.http`, `health.http`, `info.http`, `correlation-id.http`, `problem-details.http`, `http-validation.http`, `swagger.http`, `authentication-query.http`, `create-user.http`, `current-user.http` |
| API Platform | `problem-details.http.integration.spec.ts`, `http-validation.integration.spec.ts`, `swagger.http.integration.spec.ts`, `application-config.integration.spec.ts` |
| Authentication | `authentication-query.integration.spec.ts`, `authentication-query.http.integration.spec.ts`, `create-user.integration.spec.ts`, `create-user.http.integration.spec.ts`, `current-user.http.integration.spec.ts`, `jwt-authentication-context.integration.spec.ts`, `jwt-authentication-guard.integration.spec.ts` |
| Observability | `application-logger.integration.spec.ts`, `application-metrics.integration.spec.ts` |
| Repositorios / Query | `postgres-*-repository.integration.spec.ts`, `postgres-incident-timeline-repository.integration.spec.ts` |
| Transacciones | `postgres-operations-transaction-runner.integration.spec.ts` |

Los tests no requieren PostgreSQL en ejecución (usan mocks).

---

## Arquitectura

- Monolito modular, bounded context `operations` + módulos transversales (`health`, `info`, `shared`, `config`, `authentication`).
- Clean Architecture: `domain → application → infrastructure`.
- DDD táctico: agregados, Value Objects, Domain Events.
- Transactional Outbox + Event Log como fuente de verdad (Incident).
- Site y Asset: persistencia CRUD inmutable (`register` / `rehydrate`).
- WorkOrder: agregado independiente; referencia Incident por identidad sin acoplamiento.
- Notification: agregado independiente (commands) + read model `NotificationView` (queries); CQRS ligero sin eventos de dominio.
- Timeline: read model desde tablas de lectura; enriquecido en use case con entradas `NOTIFICATION` (Sprint 12).
- Dashboard: `summary` y `activityFeed` calculados en Application (Sprint 13).
- Health / Info: módulos independientes de Operations; Health verifica pool PostgreSQL; Info expone metadatos constantes.
- Observability: Correlation ID + Application Logger + Application Metrics en `SharedModule` (Sprint 14); propagación a Event Log y Outbox.
- API Platform: Problem Details (RFC 9457) + HTTP Validation global + Swagger/OpenAPI + `ApplicationConfig` (Sprint 15).
- Authentication: query/command CQRS + JWT (`JWTAuthenticationContext`) + guard HTTP + Swagger Bearer; `GET /me` protegido (Sprint 16–17).
- **Frontend:** cliente React demostrable; consume API existente sin lógica de negocio (Sprint 18).
- Query repositories: `IncidentQuery`, `EvidenceQuery`, `EventQuery`, `WorkOrderQuery`, `NotificationQuery`, `IncidentTimeline`.
- Evidence respalda Domain Events, no Incident (ADR-006).
- Site es agregado explícito; Asset referencia Site por identidad (ADR-007).
- Incident requiere Asset + Shift activo del Site; el Actor se resuelve desde el Shift.
- Incident puede generar WorkOrders y Notifications; las integraciones viven en Application, no en el dominio de Incident ni WorkOrder.

Documentación de decisiones: `docs/architecture_decisions/`.

Glosario ubicuo: `docs/glossary.md`. Deuda arquitectónica: `docs/architecture_backlog.md`.

Architecture Reviews: `docs/architecture_reviews/sprint_10_timeline.md`, `docs/architecture_reviews/sprint_11_notifications.md`, `docs/architecture_reviews/sprint_12_notification_queries.md`, `docs/architecture_reviews/sprint_13_operational_endpoints.md`, `docs/architecture_reviews/sprint_14_observability.md`, `docs/architecture_reviews/sprint_15_api_platform.md`, `docs/architecture_reviews/sprint_16_authentication_foundation.md`, `docs/architecture_reviews/sprint_17_authentication.md`, `docs/architecture_reviews/sprint_18_frontend_foundation.md`.

---

## Deliberadamente ausente

- Login / passwords / emisión de JWT / refresh tokens / autorización por roles (validación JWT operativa en `GET /me`; frontend acepta JWT pegado manualmente)
- Sincronización offline
- Concurrencia optimista
- Event Bus distribuido (RabbitMQ, Redis)
- Almacenamiento en nube
- OCR / IA
- Foreign Keys entre agregados
- Domain Events en WorkOrder (Sprint 8)
- Domain Events en Notification (Sprint 9)
- Envío real de notificaciones (email, push, websocket)
- Mark as read de notifications
- Paginación en timeline HTTP

---

## Backlog inmediato

La deuda arquitectónica P1/P2 priorizada vive en **`docs/architecture_backlog.md`** (fuente canónica, consolidada desde las Architecture Reviews).

Resumen de ítems P1 activos:

- Event Log incompleto para replay (`assetId`, `shiftId`, `actorId` en `workflow.flow.detected`)
- Integridad referencial asimétrica (Site, Actor)
- `SiteId` y `ActorId` duplicados en dominio
- Concurrencia optimista y TOCTOU
- Proyecciones legacy, errores HTTP, tests HTTP de Incident

Deuda futura Sprint 10 (Timeline): correlación Notification, historial WorkOrder, paginación.

Deuda futura Sprint 11 (Notifications): templates, canales reales, mark as read.

Deuda futura Sprint 12 (Notification Queries): `findRecent(100)` en Timeline sin filtro por Incident, paginación, mark as read.

Deuda futura Sprint 13 (Operational Endpoints): versión desde `package.json`, `environment` configurable, readiness/liveness, Activity Feed paginado, Dashboard Summary optimizable.

Deuda futura Sprint 14 (Observability): integración Prometheus, exportador OpenTelemetry, persistencia de métricas, dashboards Grafana, métricas Notification, `correlationId` en Notification.

Deuda futura Sprint 15 (API Platform): autorización, rate limiting, versionado múltiple (v2), generación automática de SDKs OpenAPI, configuración desde variables de entorno.

Deuda futura Sprint 17 (Authentication): refresh tokens, password hashing, login credentials, roles, permissions, authorization policies.

Deuda futura Sprint 18 (Frontend): login real, refresh token, paginación, filtros avanzados, campos UI pendientes, tests E2E frontend, API URL en producción.

Ver listado completo, justificaciones y P2 en `docs/architecture_backlog.md`.
