# Estado actual del proyecto

Última actualización: 2026-07-09

Sprint 2 finalizado.

---

## Resumen

| Indicador | Estado |
|-----------|--------|
| Desarrollo | Activo |
| Arquitectura | Estable |
| Walking Skeleton | Completo |
| Tests | 66/66 OK |
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

---

## Funcionalidades implementadas

### Incident

| Operación | Endpoint | Domain Event |
|-----------|----------|--------------|
| Detect | `POST /api/v1/operations/incidents` | `workflow.flow.detected` |
| Assign | `POST /api/v1/operations/incidents/:id/assign` | `workflow.flow.assigned` |
| Start | `POST /api/v1/operations/incidents/:id/start` | `workflow.flow.execution_started` |
| Resolve | `POST /api/v1/operations/incidents/:id/resolve` | `workflow.flow.resolved` |

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

PostgreSQL directo (`pg`). Sin ORM.

| Tabla | Rol |
|-------|-----|
| `incidents` | Proyección del agregado Incident |
| `events` | Event Log append-only |
| `outbox` | Mensajes pendientes de publicación |
| `evidences` | Metadata de pruebas físicas |
| `event_evidences` | Relación hecho ↔ evidencia |

Migraciones en `src/operations/infrastructure/migrations/`.

---

## Tests

```
10 test suites — 66 tests — 0 fallos
```

| Área | Archivos |
|------|----------|
| Dominio Evidence | `evidence.spec.ts` |
| Dominio Incident | `incident-aggregate-replay.spec.ts`, `incident-p0-guards.spec.ts` |
| Casos de uso | `detect-incident`, `incident-lifecycle`, `capture-evidence` |
| HTTP | `capture-evidence.http.integration.spec.ts` |
| Repositorios | `postgres-*-repository.integration.spec.ts` |
| Transacciones | `postgres-operations-transaction-runner.integration.spec.ts` |

Los tests no requieren PostgreSQL en ejecución (usan mocks).

---

## Arquitectura

- Monolito modular, bounded context `operations`.
- Clean Architecture: `domain → application → infrastructure`.
- DDD táctico: agregados, Value Objects, Domain Events.
- Transactional Outbox + Event Log como fuente de verdad.
- Evidence respalda Domain Events, no Incident (ADR-006).

Documentación de decisiones: `docs/architecture_decisions/`.

---

## Deliberadamente ausente

- Autenticación y autorización
- Sincronización offline
- Concurrencia optimista
- Event Bus distribuido (RabbitMQ, Redis)
- Almacenamiento en nube
- OCR / IA

---

## Backlog inmediato (Sprint 3)

### P1 — deuda técnica conocida

- `storageReference`: hoy lo genera la capa HTTP; evolucionar a `FileStorage.generateReference()` para que infraestructura asigne rutas.
- Validar existencia del Domain Event antes de `associate()`.
- Errores HTTP tipados (404 / 409) para reglas de negocio.
- Concurrencia optimista en `updateProjection`.
- Proyección derivada del dominio o del evento emitido.
- Definir explícitamente Flow vs Incident en glosario.

### Política de almacenamiento

Local filesystem hasta que una Field Story real exija otra cosa.

### Regla de identidad

El SHA-256 verifica integridad, no identidad. Dos capturas idénticas son dos evidencias distintas. Sin deduplicación automática por hash.
