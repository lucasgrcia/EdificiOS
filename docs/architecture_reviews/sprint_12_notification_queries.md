# Architecture Review — Sprint 12: Notification Queries (Read Model)

**Objetivo:** exponer lectura de Notifications sin modificar agregados, Event Log ni commands; consolidar CQRS ligero en Dashboard y Timeline.  
**Alcance revisado:** PR1–PR5 (read model, HTTP query, dashboard por Actor, timeline enriquecido, documentación).

---

## Veredicto

**Sprint 12 es aprobable sin correcciones P0.**

La lectura de Notifications sigue el patrón establecido en Sprint 7 (Incident queries): `NotificationView`, `NotificationQueryRepository`, use cases de delegación pura y controller HTTP delgado separado del command `POST /notifications`. Dashboard y Timeline reutilizan el mismo query repository sin SQL nuevo ni puertos adicionales.

La deuda identificada es P2: correlación Timeline ↔ Incident vía `findRecent(100)`, ausencia de paginación y mark as read.

---

## Objetivo

Completar el lado **query** del ciclo de Notification:

1. Read model (`NotificationView`)
2. HTTP Query API (`GET` por id y por Actor)
3. Dashboard con `notifications` del Actor seleccionado
4. Timeline enriquecido con entradas `NOTIFICATION` del ciclo Incident

Sin modificar `NotificationAggregate`, `CreateNotificationUseCase`, Event Log ni commands existentes.

---

## Arquitectura

### CQRS ligero consolidado

| Lado | Componentes |
|------|-------------|
| **Commands** | `NotificationAggregate`, `NotificationRepository`, `CreateNotificationUseCase`, `NotificationsController` (POST) |
| **Queries** | `NotificationView`, `NotificationQueryRepository`, `GetNotificationByIdUseCase`, `ListNotificationsUseCase`, `NotificationQueryController` (GET) |

Los agregados operativos (Incident, WorkOrder) siguen sin conocer el read model.

### Reutilización del query repository

Un solo `NotificationQueryRepository` alimenta:

- HTTP Query (`findById`, `findByRecipient`)
- Dashboard (`findByRecipient` cuando `actorId` presente; `findRecent` para `recentNotifications`)
- Timeline (`findRecent(100)` en use case)

---

## Read Models

### `NotificationView`

DTO de lectura con siete campos: `id`, `recipientId`, `type`, `channel`, `status`, `message`, `createdAt`.

Mapper desde fila SQL o `NotificationRecord`; sin lógica de negocio.

### `NotificationQueryView`

Vista reducida para `findRecent()` en Dashboard global (`recentNotifications`). Coexiste con `NotificationView`; no se unificaron para no alterar contratos Sprint 10.

---

## Queries

| Use case | Método repositorio | HTTP |
|----------|-------------------|------|
| `GetNotificationByIdUseCase` | `findById` | `GET /notifications/:id` |
| `ListNotificationsUseCase` | `findByRecipient` | `GET /actors/:actorId/notifications` |

Delegación pura. Orden `createdAt` DESC en `findByRecipient` (repositorio existente).

---

## Dashboard

`DashboardView` extendido con `notifications: NotificationView[]`.

| Condición | Comportamiento |
|-----------|----------------|
| `actorId` en query | `findByRecipient(actorId)` → `notifications` |
| Sin `actorId` | `notifications = []` (sin error, sin validar Actor) |

`recentNotifications` (global, últimos 10) se mantiene sin cambios.

---

## Timeline

Tras construir el timeline base (`IncidentTimelineRepository`):

1. `NotificationQueryRepository.findRecent(100)`
2. Filtrar: `INCIDENT_DETECTED`, `INCIDENT_ASSIGNED`, `INCIDENT_RESOLVED`
3. Mapear a `TimelineEntryView` con `type: NOTIFICATION`
4. Merge + sort ASC + dedupe

Excluidos: `WORK_ORDER_STARTED`, `WORK_ORDER_COMPLETED`.

Mismo DTO HTTP; sin nuevo endpoint.

---

## Ventajas

| Ventaja | Descripción |
|---------|-------------|
| **Patrón consistente** | Igual que Incident/Evidence queries (Sprint 7) |
| **Separación Commands/Queries** | Controllers distintos; wiring independiente |
| **Sin SQL nuevo** | Reutiliza métodos existentes del query repository |
| **Composición en Application** | Timeline enriquecido en use case, no en dominio |
| **Evolución incremental** | Read model extensible sin tocar agregado |

---

## Trade-offs

| Trade-off | Consecuencia |
|-----------|--------------|
| **`findRecent(100)` en Timeline** | Sin filtro por `incidentId`; notificaciones `INCIDENT_*` recientes pueden aparecer en timelines ajenos |
| **Dos vistas de Notification** | `NotificationView` (completa) y `NotificationQueryView` (dashboard reciente) |
| **Sin paginación** | `findByRecipient` y timeline devuelven listas completas dentro del límite |
| **Sin mark as read** | Estado `READ` en dominio sin use case ni transición |
| **Sin canales reales** | `IN_APP` persistido; sin delivery providers |
| **Doble fuente en Timeline** | Repositorio SQL + use case `findRecent`; posible duplicación conceptual |

---

## Deuda pendiente (P2)

| Ítem | Justificación |
|------|---------------|
| Timeline usa `findRecent(100)` | Sin correlación explícita Notification ↔ Incident |
| Sin `incident_id` en `notifications` | Filtro por tipo solamente en enriquecimiento |
| Mark as read | Dominio define `READ` sin caso de uso |
| Canales reales | Sin email, push ni websocket |
| Paginación | HTTP query y timeline sin límite configurable |
| Templates parametrizables | Mensajes fijos en use cases de escritura (Sprint 11) |

---

## P1 — Sin ítems nuevos

No se detectaron bloqueos estructurales. Los ítems P1 del backlog (Event Log incompleto, integridad referencial, concurrencia) siguen vigentes.

---

## Conclusión

Sprint 12 cierra el **read path** de Notification: consulta por Actor, integración en Dashboard y visibilidad en Timeline. El proyecto consolida CQRS ligero en Operations sin introducir infraestructura nueva ni modificar el modelo de escritura.

Queda deuda consciente en correlación Timeline–Incident y capacidades de producto (paginación, mark as read, delivery).

---

## Referencias

- Review: este documento
- Backlog: `docs/architecture_backlog.md`
- Estado: `docs/05_current_status.md`
- Glosario: `docs/glossary.md`
- Sprint 11 (commands): `docs/architecture_reviews/sprint_11_notifications.md`
