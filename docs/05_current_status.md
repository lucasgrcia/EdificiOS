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
