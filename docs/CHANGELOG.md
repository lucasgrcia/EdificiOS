# Changelog

Todos los cambios importantes de EdificiOS se documentan aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/).

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
