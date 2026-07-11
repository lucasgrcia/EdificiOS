# Architecture Review — Sprint 10: Timeline operacional

**Objetivo:** validar el read model de Timeline y la integración en Dashboard sin tocar dominio ni Event Log.  
**Alcance revisado:** PR1–PR5 (query model, use case, HTTP, dashboard, documentación).

---

## Veredicto

**Sprint 10 es aprobable sin correcciones P0.**

El Timeline cumple el rol de read model: compone una vista cronológica desde tablas de lectura sin replay, sin mutar agregados y sin usar `current_projection_state`. La capa HTTP y el use case mantienen delegación pura. El Dashboard reutiliza query repositories con SQL mínimo (`findRecent` + `IncidentQueryRepository.findAll`).

La deuda identificada es P2: correlación heurística de notifications y ausencia de historial de transiciones en WorkOrder.

---

## Lo que está bien (mantener)

| Área | Evaluación |
|------|------------|
| **Separación read/write** | Timeline es query-side; no modifica agregados ni Event Log |
| **Fuentes permitidas** | Solo `events`, `event_evidences`, `work_orders`, `notifications` |
| **Use case** | `GetIncidentTimelineUseCase` sin lógica de negocio |
| **HTTP** | Controller delgado; respuesta plana (solo array de entradas) |
| **Dashboard** | Reutiliza `IncidentQueryRepository`; query repos nuevos con `findRecent(limit)` |
| **Tests** | Repositorio, use case, HTTP y dashboard cubiertos con mocks |

---

## P1 — Sin ítems nuevos

No se detectaron bloqueos estructurales. Los ítems P1 existentes del backlog (Event Log incompleto, integridad referencial, concurrencia) siguen vigentes y no se agravan con este sprint.

---

## P2 — Deuda consciente (nuevo)

| Ítem | Justificación |
|------|---------------|
| Correlación Notification ↔ Incident sin `incident_id` | Tabla `notifications` no referencia Incident; el timeline usa actores del incident + ventana temporal de 60s para `INCIDENT_DETECTED` |
| WorkOrder en timeline solo en creación | Tabla `work_orders` no registra historial de transiciones; solo aparece `WORK_ORDER_CREATED` |
| Evidencias sin tabla `evidences` en timeline | Entrada `EVIDENCE_ASSOCIATED` usa `event_evidences` + timestamp del evento padre |
| `recentIncidents` sin reorden explícito | Reutiliza orden de `IncidentQueryRepository.findAll` (ya DESC por `created_at`) |

---

## Recomendaciones para sprint siguiente

1. Evaluar `incident_id` en `notifications` si la correlación heurística genera falsos positivos en producción.
2. Exponer timeline en Field Stories 001/005 como narrativa de continuidad operativa.
3. Considerar paginación/límite configurable en timeline HTTP si el volumen de eventos crece.

---

## Referencias

- Review: este documento
- Backlog: `docs/architecture_backlog.md`
- Estado: `docs/05_current_status.md`
