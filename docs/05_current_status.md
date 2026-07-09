Estado actual

Sprint 0

Completado

✔ IncidentAggregate

✔ Domain Events

✔ PostgreSQL

✔ Walking Skeleton

✔ Outbox

✔ Endpoint HTTP

✔ Integration Test

Sprint 1

Completado

✔ Incident Lifecycle (DETECTED → ASSIGNED → IN_PROGRESS → RESOLVED)

✔ Transiciones validadas en dominio con un DomainEvent por transición

✔ Persistencia transaccional (incidents + events + outbox)

✔ Endpoints HTTP del ciclo de vida

✔ Integration Tests (transiciones válidas e inválidas)

✔ Replay del agregado desde Domain Events

Eventos validados del ciclo de vida

- workflow.flow.detected
- workflow.flow.assigned
- workflow.flow.execution_started
- workflow.flow.resolved

Próximo Sprint

Sprint 2

Pendiente de definición.

Backlog heredado de la revisión de arquitectura (P1)

- Proyección derivada del dominio o del evento emitido
- Errores HTTP tipados (404 / 409)
- Concurrencia optimista en updateProjection
- Definición explícita Flow vs Incident en glosario

9/7/26 - 11:48 Actualizacion del projecto e historial de seguimiento--

Sprint 0
✔ Walking Skeleton
✔ Event Log
✔ Outbox
✔ Incident Projection
✔ Fitness Tests

Sprint 1
✔ Incident Aggregate
✔ Incident Lifecycle
✔ Replay
✔ Guards
✔ Integration Tests

Sprint 2

PR1
✔ Evidence Domain

PR2
✔ Evidence Persistence
✔ File Storage
✔ StorageReference
✔ MimeType
✔ SHA256

PR3
✔ Event ↔ Evidence (tabla puente event_evidences)

PR4
✔ CaptureEvidenceUseCase

PR5
✔ HTTP Capture Evidence (POST /api/v1/operations/events/:eventId/evidence)

Backlog Sprint 3 (P1 — revisión arquitectura PR4)

- `storageReference` lo decide hoy el cliente del caso de uso; evolucionar a `FileStorage.generateReference()` para que la infraestructura asigne rutas y el command no reciba paths
- Validar existencia del Domain Event antes de `associate()`; hoy cualquier UUID persiste y puede romper la semántica hecho ↔ prueba
- El SHA-256 verifica integridad, no identidad: dos capturas idénticas son dos evidencias distintas (sin deduplicación automática por hash)

Política de almacenamiento

Local filesystem hasta que una historia de campo real exija otra cosa. Sin S3, Azure Blob, MinIO ni cloud storage por anticipación.

Backlog heredado (Sprint 1)

- Proyección derivada del dominio o del evento emitido
- Errores HTTP tipados (404 / 409)
- Concurrencia optimista en updateProjection
- Definición explícita Flow vs Incident en glosario