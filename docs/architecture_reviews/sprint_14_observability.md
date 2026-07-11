# Architecture Review — Sprint 14: Observability

**Objetivo:** introducir observabilidad transversal (tracing, logging, metrics) sin modificar dominio, agregados ni librerías externas.  
**Alcance revisado:** PR1–PR5 (Correlation ID, propagación a Event Log/Outbox, Application Logger, Application Metrics, documentación).

---

## Veredicto

**Sprint 14 es aprobable sin correcciones P0.**

El sistema gana trazabilidad end-to-end por request HTTP: Correlation ID propagado a persistencia, logs estructurados y contadores en memoria. Todo vive en `src/shared/` como infraestructura transversal reutilizable por Application.

La deuda identificada es P2: exportación Prometheus/OpenTelemetry, persistencia de métricas, dashboards Grafana, métricas Notification y `correlationId` en Notification.

---

## Objetivo

1. **Correlation ID** — UUID por request, disponible en Application vía ALS
2. **Propagación** — mismo UUID en Event Log y Outbox
3. **Application Logger** — logs estructurados con `correlationId`
4. **Application Metrics** — contadores success/failure en memoria para Incident

Sin modificar dominio, agregados, Timeline, Dashboard, Notifications ni agregar Prometheus.

---

## Arquitectura

### Estructura Shared

```
src/shared/
├── correlation-id.ts              ← CorrelationIdProvider (ALS)
├── http/
│   └── correlation-id.middleware.ts ← UUID por request
├── logging/
│   ├── logger.ts
│   └── application-logger.ts        ← structured logs
├── metrics/
│   ├── metrics-view.ts
│   └── application-metrics.ts       ← contadores en memoria
└── shared.module.ts                 ← @Global()
```

`SharedModule` exporta `CorrelationIdProvider`, `ApplicationLogger` y `ApplicationMetrics` como singletons globales.

### Flujo de observabilidad

```
HTTP Request
    ↓
CorrelationIdMiddleware
    ├── header x-correlation-id
    └── CorrelationIdProvider.runWithCorrelationId(uuid)
            ↓
    Incident Use Case (detect/assign/start/resolve)
            ├── ApplicationLogger.info/error
            ├── ApplicationMetrics.increment(success|failure)
            ├── events.correlation_id
            └── outbox.correlation_id
```

---

## Tracing

| Componente | Rol |
|------------|-----|
| `CorrelationIdMiddleware` | Genera UUID; no reutiliza header entrante |
| `CorrelationIdProvider` | ALS; `get()` en cualquier punto del request |
| Propagación DB | `correlation_id` en `events` y `outbox` |

**Regla:** Application no genera UUID nuevos; solo reutiliza el del request.

**Migración:** `010_outbox_correlation_id.sql` (columna `events.correlation_id` ya existía).

---

## Logging

| Componente | Rol |
|------------|-----|
| `ApplicationLogger` | `info()` / `error()` → objeto estructurado |
| Dependencias | `CorrelationIdProvider`, `Clock` |
| Salida | `JSON.stringify(entry)` a stdout |

**Formato:**

```json
{
  "timestamp": "2026-07-11T14:00:00.000Z",
  "level": "INFO",
  "correlationId": "uuid",
  "message": "DetectIncidentUseCase started"
}
```

**Integración:** los 4 use cases Incident loguean start, success y error. No reemplaza NestJS logger.

---

## Metrics

| Componente | Rol |
|------------|-----|
| `ApplicationMetrics` | `Map<string, number>` en memoria |
| API | `increment`, `get`, `snapshot`, `reset` |

**Métricas registradas:**

| Métrica | Cuándo |
|---------|--------|
| `incident.detect.success` | Detect completa sin excepción |
| `incident.detect.failure` | Detect lanza excepción |
| `incident.assign.success/failure` | Idem assign |
| `incident.start.success/failure` | Idem start |
| `incident.resolve.success/failure` | Idem resolve |

---

## Decisiones tomadas

| Decisión | Justificación |
|----------|---------------|
| **ALS para Correlation ID** | Application accede sin acoplar HTTP ni NestJS REQUEST scope |
| **SharedModule @Global()** | Singleton compartido entre middleware y use cases |
| **Propagación solo Incident** | MVP acotado; Notification/WorkOrder fuera de alcance |
| **Logs JSON a stdout** | Sin librerías externas; parseable por agregadores futuros |
| **Métricas en memoria** | Sin Prometheus; suficiente para MVP y tests |
| **No tocar dominio** | `correlationId` se añade en Application al mapear records |

---

## Trade-offs

| Trade-off | Consecuencia |
|-----------|--------------|
| **Sin header entrante** | Siempre genera UUID nuevo; no propaga ID del cliente |
| **ALS + async** | Depende de continuidad del contexto Node.js en la cadena del request |
| **Logs solo Incident** | WorkOrder, Notification, Shift sin structured logging |
| **Métricas volátiles** | Se pierden al reiniciar; sin histórico |
| **Sin exportación** | No hay scrape Prometheus ni OTLP |
| **Outbox payload duplica correlationId** | Presente en registro Outbox y en `payload` del evento |

---

## Deuda futura (P2)

| Ítem | Justificación |
|------|---------------|
| Integración Prometheus | Endpoint `/metrics` y scrape |
| Exportador OpenTelemetry | Spans, traces distribuidos |
| Persistencia de métricas | Series temporales entre reinicios |
| Dashboards Grafana | Visualización operativa |
| Métricas Notification | Contadores para ciclo de notificaciones |
| `correlationId` en Notification | Trazabilidad completa del flujo operativo |

---

## P1 — Sin ítems nuevos

No se detectaron bloqueos estructurales. Los ítems P1 del backlog (Event Log incompleto, integridad referencial, concurrencia) siguen vigentes.

---

## Conclusión

Sprint 14 establece la **base de observabilidad** del monolito: tracing por Correlation ID, logging estructurado y métricas en memoria, con propagación a Event Log y Outbox. La arquitectura permanece limpia: dominio intacto, capacidades transversales en `shared`, integración en Application sin alterar lógica de negocio.

Queda deuda consciente en exportación externa (Prometheus, OpenTelemetry, Grafana) y extensión a otros bounded contexts.

---

## Referencias

- Review: este documento
- Backlog: `docs/architecture_backlog.md`
- Estado: `docs/05_current_status.md`
- Glosario: `docs/glossary.md`
- Sprint 13 (endpoints): `docs/architecture_reviews/sprint_13_operational_endpoints.md`
