# Estado actual del proyecto

Última actualización: 2026-07-10

Sprint 9 — cerrado.

---

## Resumen

| Indicador | Estado |
|-----------|--------|
| Desarrollo | Activo |
| Arquitectura | Estable |
| Walking Skeleton | Completo |
| Tests | 443/443 OK |
| Build | OK |

---

## Estado actual

El sistema posee **ocho agregados/módulos operativos**, todos integrados en el bounded context `operations`:

| Módulo | Rol | Integración |
|--------|-----|-------------|
| **Incident** | Detección y ciclo de vida de incidencias | Asset, Shift, Actor; genera WorkOrder y Notification |
| **Evidence** | Prueba física asociada a Domain Events | Event Log |
| **Asset** | Activos del edificio | Site; requerido para detección |
| **Shift** | Continuidad operativa por Site | Site; requerido para detección |
| **Site** | Edificio explícito | Asset, Shift, Actor |
| **Actor** | Persona operativa | Shift, Incident (resolución en detección) |
| **WorkOrder** | Orden de trabajo derivada de Incident | Incident (Application) |
| **Notification** | Intención de notificación a un Actor | Incident (Application, post-detección) |

Cadena operativa completa:

```
Site → Asset → Shift → Actor
              ↓
         Incident (detect)
              ├── WorkOrder (opcional)
              └── Notification (automática)
```

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

---

## Funcionalidades implementadas

### Incident

| Operación | Endpoint | Requisito |
|-----------|----------|-----------|
| Detect | `POST /api/v1/operations/incidents` | Asset existente + Shift activo del Site |

El sistema resuelve automáticamente `actorId` desde el Actor del Shift activo. El cliente envía solo `assetId` y `description`.

Tras detección exitosa, el sistema crea automáticamente una Notification para el Actor destinatario (`assignedActorId ?? actorId`). La integración vive en Application; Incident no conoce Notification.

| Operación | Endpoint | Requisito |
|-----------|----------|-----------|
| Assign | `POST /api/v1/operations/incidents/:id/assign` | — |
| Start | `POST /api/v1/operations/incidents/:id/start` | — |
| Resolve | `POST /api/v1/operations/incidents/:id/resolve` | — |
| List | `GET /api/v1/operations/incidents` | — |
| Get by id | `GET /api/v1/operations/incidents/:id` | — |

La proyección de Incident incluye `assetId`, `shiftId` y `actorId` (Actor del Turno al momento de la detección).

Un Incident puede generar WorkOrders. La relación vive en Application; el agregado Incident no conoce WorkOrder.

### WorkOrder

| Operación | Endpoint | Requisito |
|-----------|----------|-----------|
| Create | `POST /api/v1/operations/work-orders` | Incident + Actor existentes; sin otro WorkOrder `OPEN` |
| Create from Incident | `POST /api/v1/operations/incidents/:incidentId/work-orders` | Incident existente; resuelve `actorId` desde proyección |
| Get by id | `GET /api/v1/operations/work-orders/:id` | — |
| List by Incident | `GET /api/v1/operations/incidents/:incidentId/work-orders` | — |
| Start | `POST /api/v1/operations/work-orders/:id/start` | Estado `OPEN` |
| Complete | `POST /api/v1/operations/work-orders/:id/complete` | Estado `IN_PROGRESS` |
| Cancel | `POST /api/v1/operations/work-orders/:id/cancel` | Estado `OPEN` o `IN_PROGRESS` |

Regla: un solo WorkOrder `OPEN` por Incident.

Cadena de integración:

```
Incident → CreateWorkOrderFromIncidentUseCase → CreateWorkOrderUseCase
```

Resolución de actor: `assignedActorId ?? actorId` desde la proyección del Incident.

Estado: **completo** (dominio, persistencia, application, HTTP e integración Incident).

### Notification

| Operación | Endpoint | Requisito |
|-----------|----------|-----------|
| Create | `POST /api/v1/operations/notifications` | `recipientId`, `type`, `channel`, `message` |

Notificación automática al detectar Incident (sin endpoint adicional):

```
DetectIncidentUseCase → CreateNotificationUseCase
  type: INCIDENT_DETECTED
  channel: IN_APP
  recipientId: assignedActorId ?? actorId
```

**Importante:** Notification representa intención persistida, no envío real (email, push, websocket).

Estados en dominio: `PENDING`, `SENT`, `FAILED`, `READ`. Sin transiciones ni lectura HTTP en Sprint 9.

Estado: **completo** para creación y persistencia; lectura, mark as read y delivery providers quedan en backlog.

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

Estado: **operativo** (Sprint 7). Agrega métricas de Incident; no incluye aún WorkOrder ni Notification.

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

Migraciones en `src/operations/infrastructure/migrations/`.

---

## Tests

```
41 test suites — 443 tests — 0 fallos
```

| Área | Archivos |
|------|----------|
| Dominio Site / Asset / Shift / Actor / WorkOrder / Notification | `site.spec.ts`, `asset.spec.ts`, `shift.spec.ts`, `actor.spec.ts`, `work-order.spec.ts`, `notification.spec.ts` |
| Dominio Incident | `incident-aggregate-replay.spec.ts`, `incident-p0-guards.spec.ts` |
| Dominio Evidence | `evidence.spec.ts` |
| Casos de uso | `detect-incident`, `incident-lifecycle`, `capture-evidence`, `shift-use-cases`, `register-asset-use-case`, `work-order-use-cases`, `incident-work-order`, `create-notification` |
| HTTP | `site.http`, `asset.http`, `shift.http`, `actor.http`, `capture-evidence.http`, `incident-query.http`, `work-orders.http`, `notification.http` |
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
- WorkOrder: agregado independiente; referencia Incident por identidad sin acoplamiento.
- Notification: agregado independiente; intención persistida sin delivery real; integración post-transacción desde `DetectIncidentUseCase`.
- Evidence respalda Domain Events, no Incident (ADR-006).
- Site es agregado explícito; Asset referencia Site por identidad (ADR-007).
- Incident requiere Asset + Shift activo del Site; el Actor se resuelve desde el Shift.
- Incident puede generar WorkOrders y Notifications; las integraciones viven en Application, no en el dominio de Incident.

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
- Domain Events en WorkOrder (Sprint 8)
- Domain Events en Notification (Sprint 9)
- Envío real de notificaciones (email, push, websocket)
- Lectura HTTP de notifications y mark as read

---

## Backlog inmediato

La deuda arquitectónica P1/P2 priorizada vive en **`docs/architecture_backlog.md`** (fuente canónica, consolidada desde las Architecture Reviews).

Resumen de ítems P1 activos:

- Event Log incompleto para replay (`assetId`, `shiftId`, `actorId` en `workflow.flow.detected`)
- Integridad referencial asimétrica (Site, Actor)
- `SiteId` y `ActorId` duplicados en dominio
- Concurrencia optimista y TOCTOU
- Proyecciones legacy, errores HTTP, tests HTTP de Incident

Deuda futura Sprint 9 (Notification): lectura, mark as read, delivery providers, Event Log enriquecido.

Ver listado completo, justificaciones y P2 en `docs/architecture_backlog.md`.
