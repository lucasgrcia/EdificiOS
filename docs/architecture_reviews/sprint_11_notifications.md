# Architecture Review — Sprint 11: Automatización operacional de Notifications

**Objetivo:** completar el ciclo de notificaciones automáticas en operaciones sin modificar dominio, Event Log, Timeline, Dashboard ni HTTP.  
**Alcance revisado:** PR1–PR5 (integraciones Application, tests de integración, documentación).

---

## Veredicto

**Sprint 11 es aprobable sin correcciones P0.**

Las cinco notificaciones operativas se crean exclusivamente desde Application, siempre **después** de una persistencia exitosa. `CreateNotificationUseCase` es el único punto de creación. Los agregados Incident y WorkOrder no conocen Notification; el agregado Notification no participa del Event Log ni genera transiciones en otros agregados.

---

## Objetivo

Automatizar mensajes operativos (`IN_APP`) para los hitos del flujo de trabajo:

1. Detección de Incident
2. Asignación de Incident
3. Inicio de WorkOrder
4. Completado de WorkOrder
5. Resolución de Incident

Sin delivery real (email, push, websocket). Sin nuevos eventos de dominio. Sin acoplar agregados.

---

## Arquitectura elegida

### Integración exclusivamente desde Application

Cada use case principal sigue el mismo patrón:

```
UseCase principal.execute()
  → persistencia completa (transacción o update)
  → CreateNotificationUseCase.execute({ recipientId, type, channel, message })
  → return
```

**Nunca antes de la persistencia.** Si falla validación, transición o persistencia, no se crea Notification.

### Punto único de creación

`CreateNotificationUseCase` centraliza la creación y persistencia de toda Notification, ya sea manual (HTTP `POST /notifications`) o automática (integraciones Sprint 9 + Sprint 11).

---

## Decisión: NO integrar desde el dominio

| Razón | Detalle |
|-------|---------|
| **Agregados independientes** | Notification es un agregado propio; Incident y WorkOrder no deben conocerlo |
| **Event Log de Incident intacto** | Las transiciones de Incident ya producen Domain Events; Notification no es un hecho de dominio del workflow |
| **Sin side effects en transacciones** | La notificación vive fuera de la transacción Incident; fallo en Notification no revierte la operación principal |
| **Composición sobre acoplamiento** | Application orquesta use cases; no se introducen Domain Services ni eventos cruzados |
| **MVP acotado** | Sin Event Sourcing en Notification; sin outbox de delivery |

---

## Ventajas

| Ventaja | Descripción |
|---------|-------------|
| **Dominio puro** | Incident y WorkOrder permanecen sin imports ni referencias a Notification |
| **Testabilidad** | Tests de integración mockean `CreateNotificationUseCase` y verifican llamada post-persistencia |
| **Consistencia** | Mismo patrón en los cinco puntos de integración |
| **Evolución independiente** | Templates, canales y delivery pueden añadirse en Application/infra sin tocar agregados operativos |
| **Rollback seguro** | Error en creación de Notification no invalida la transición ya persistida |

---

## Trade-offs

| Trade-off | Consecuencia |
|-----------|--------------|
| **Sin `incident_id` en `notifications`** | Timeline correlaciona por heurística (actores + ventana temporal); deuda P2 |
| **Mensajes hardcodeados en use cases** | Sin templates parametrizables; deuda P2 |
| **Sin transacción compartida** | Notification y operación principal no son atómicas entre sí; aceptable en MVP |
| **Sin mark as read** | Estado `READ` existe en dominio sin caso de uso; deuda P2 |
| **Canal `IN_APP` sin UI real** | Intención persistida; dashboard muestra `recentNotifications` pero sin bandeja de entrada |

---

## Flujo completo

```
Incident.detect()
        ↓
Notification INCIDENT_DETECTED
        (DetectIncidentUseCase)

Incident.assign()
        ↓
Notification INCIDENT_ASSIGNED
        (AssignIncidentUseCase)

WorkOrder.start()
        ↓
Notification WORK_ORDER_STARTED
        (StartWorkOrderUseCase)

WorkOrder.complete()
        ↓
Notification WORK_ORDER_COMPLETED
        (CompleteWorkOrderUseCase)

Incident.resolve()
        ↓
Notification INCIDENT_RESOLVED
        (ResolveIncidentUseCase)
```

### Resolución de `recipientId`

| Integración | Criterio |
|-------------|----------|
| Detect, Assign, Resolve (Incident) | `assignedActorId ?? actorId` desde proyección (Assign usa el `actorId` del comando de asignación) |
| Start, Complete (WorkOrder) | `actorId` del registro de WorkOrder |

Todos los canales automáticos: `IN_APP`.

---

## Integraciones por PR

| PR | Use case | Type | Persistencia previa |
|----|----------|------|---------------------|
| Sprint 9 PR4 | `DetectIncidentUseCase` | `INCIDENT_DETECTED` | Transacción Incident |
| Sprint 11 PR1 | `AssignIncidentUseCase` | `INCIDENT_ASSIGNED` | Transacción Incident |
| Sprint 11 PR2 | `StartWorkOrderUseCase` | `WORK_ORDER_STARTED` | `WorkOrderRepository.update` |
| Sprint 11 PR3 | `CompleteWorkOrderUseCase` | `WORK_ORDER_COMPLETED` | `WorkOrderRepository.update` |
| Sprint 11 PR4 | `ResolveIncidentUseCase` | `INCIDENT_RESOLVED` | Transacción Incident |

---

## P1 — Sin ítems nuevos

No se detectaron bloqueos estructurales. Los ítems P1 del backlog (Event Log incompleto, integridad referencial, concurrencia) siguen vigentes y no se agravan con este sprint.

---

## P2 — Deuda consciente (nuevo)

| Ítem | Justificación |
|------|---------------|
| Templates parametrizables | Mensajes fijos en constantes de cada use case |
| Canales futuros (Push/Email reales) | Solo `IN_APP` persistido; sin delivery providers |
| Notification Query API | Falta `GET` / list by recipient |
| Notification Read Model | Dashboard usa `findRecent`; sin vista por Actor |
| Estado `READ` / mark as read | Dominio define `READ` sin transición ni use case |

---

## Referencias

- Review: este documento
- Backlog: `docs/architecture_backlog.md`
- Estado: `docs/05_current_status.md`
- Glosario: `docs/glossary.md`
