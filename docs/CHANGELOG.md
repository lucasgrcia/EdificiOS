# Changelog

Todos los cambios importantes de EdificiOS se documentan aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/).

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
