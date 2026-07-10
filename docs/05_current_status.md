# Estado actual del proyecto

Última actualización: 2026-07-10

Sprint 6 — PR5 en revisión.

---

## Resumen

| Indicador | Estado |
|-----------|--------|
| Desarrollo | Activo |
| Arquitectura | Estable |
| Walking Skeleton | Completo |
| Tests | 256/256 OK |
| Build | OK |

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
| PR5 | Integración Actor ↔ Incident | En revisión |

---

## Funcionalidades implementadas

### Incident

| Operación | Endpoint | Requisito |
|-----------|----------|-----------|
| Detect | `POST /api/v1/operations/incidents` | Asset existente + Shift activo del Site |

El sistema resuelve automáticamente `actorId` desde el Actor del Shift activo. El cliente envía solo `assetId` y `description`.

| Operación | Endpoint | Requisito |
|-----------|----------|-----------|
| Assign | `POST /api/v1/operations/incidents/:id/assign` | — |
| Start | `POST /api/v1/operations/incidents/:id/start` | — |
| Resolve | `POST /api/v1/operations/incidents/:id/resolve` | — |

La proyección de Incident incluye `assetId`, `shiftId` y `actorId` (Actor del Turno al momento de la detección).

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

Migraciones en `src/operations/infrastructure/migrations/`.

---

## Tests

```
24 test suites — 256 tests — 0 fallos
```

| Área | Archivos |
|------|----------|
| Dominio Site / Asset / Shift | `site.spec.ts`, `asset.spec.ts`, `shift.spec.ts` |
| Dominio Incident | `incident-aggregate-replay.spec.ts`, `incident-p0-guards.spec.ts` |
| Dominio Evidence | `evidence.spec.ts` |
| Casos de uso | `detect-incident`, `incident-lifecycle`, `capture-evidence`, `shift-use-cases`, `register-asset-use-case` |
| HTTP | `site.http`, `asset.http`, `shift.http`, `capture-evidence.http` |
| Repositorios | `postgres-*-repository.integration.spec.ts` |
| Transacciones | `postgres-operations-transaction-runner.integration.spec.ts` |

Los tests no requieren PostgreSQL en ejecución (usan mocks).

---

## Arquitectura

- Monolito modular, bounded context `operations`.
- Clean Architecture: `domain → application → infrastructure`.
- DDD táctico: agregados, Value Objects, Domain Events.
- Transactional Outbox + Event Log como fuente de verdad (Incident).
- Site y Asset: persistencia CRUD inmutable (`register` / `rehydrate`).
- Evidence respalda Domain Events, no Incident (ADR-006).
- Site es agregado explícito; Asset referencia Site por identidad (ADR-007).
- Incident requiere Asset + Shift activo del Site del Asset; el Actor se resuelve desde el Shift.

Documentación de decisiones: `docs/architecture_decisions/`.

Glosario ubicuo: `docs/glossary.md`. Deuda arquitectónica: `docs/architecture_backlog.md`.

---

## Deliberadamente ausente

- Autenticación y autorización
- Sincronización offline
- Concurrencia optimista
- Event Bus distribuido (RabbitMQ, Redis)
- Almacenamiento en nube
- OCR / IA
- Foreign Keys entre agregados

---

## Backlog inmediato

La deuda arquitectónica P1/P2 priorizada vive en **`docs/architecture_backlog.md`** (fuente canónica, consolidada desde las Architecture Reviews).

Resumen de ítems P1 activos:

- Event Log incompleto para replay (`assetId`, `shiftId`, `actorId` en `workflow.flow.detected`)
- Integridad referencial asimétrica (Site, Actor)
- `SiteId` y `ActorId` duplicados en dominio
- Concurrencia optimista y TOCTOU
- Proyecciones legacy, errores HTTP, tests HTTP de Incident

Ver listado completo, justificaciones y P2 en `docs/architecture_backlog.md`.
