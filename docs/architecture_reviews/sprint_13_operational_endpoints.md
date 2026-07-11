# Architecture Review — Sprint 13: Operational Endpoints

**Objetivo:** enriquecer el dashboard operacional y exponer endpoints transversales de observabilidad (Health, Info) sin modificar dominio, Event Log ni CQRS.  
**Alcance revisado:** PR1–PR5 (Dashboard Summary, Activity Feed, Health Module, API Info Module, documentación).

---

## Veredicto

**Sprint 13 es aprobable sin correcciones P0.**

El dashboard gana `summary` y `activityFeed` calculados en Application sobre datos ya cargados. Health e Info viven en módulos independientes de `operations`, con responsabilidades claramente separadas. No se introdujo SQL nuevo, repositorios ni dependencias externas.

La deuda identificada es P2: versión duplicada, environment fijo, ausencia de readiness/liveness y métricas, límites fijos en Activity Feed.

---

## Objetivo

1. **Dashboard Summary** — totales operativos en `DashboardView.summary`
2. **Activity Feed** — feed mezclado de actividad reciente en `DashboardView.activityFeed`
3. **Health Module** — disponibilidad técnica vía `SELECT 1` sobre pool existente
4. **API Info Module** — metadatos públicos constantes de la API

Sin modificar agregados, Event Log, Timeline, CQRS ni query repositories existentes.

---

## Arquitectura

### Estructura de módulos

```
src/
├── operations/          ← bounded context (dominio + queries operativas)
├── health/              ← transversal (disponibilidad)
│   ├── application/
│   └── infrastructure/http/
└── info/                ← transversal (metadatos)
    ├── application/
    └── infrastructure/http/
```

`AppModule` importa `OperationsModule`, `HealthModule` e `InfoModule` como hermanos. Health importa `OperationsModule` únicamente para reutilizar `PostgresOperationsPool` exportado.

### Dashboard (Operations)

| Componente | Rol |
|------------|-----|
| `DashboardSummary` | DTO con 9 totales operativos |
| `ActivityFeedEntry` | Entrada del feed (`timestamp`, `type`, `title`, `description`, `actorId?`) |
| `GetOperationsDashboardUseCase` | Calcula `summary` y `activityFeed` en memoria |

Flujo:

```
Query repositories (datos ya cargados)
        ↓
buildDashboardSummary()
buildActivityFeed()  → merge + sort DESC + slice(20)
        ↓
DashboardView
```

### Health (transversal)

| Componente | Rol |
|------------|-----|
| `GetHealthUseCase` | `SELECT 1` + timestamp + checks |
| `HealthController` | `GET /api/v1/health` |

Dependencias: `PostgresOperationsPool`, `Clock`. Sin repositorios ni servicios adicionales.

### Info (transversal)

| Componente | Rol |
|------------|-----|
| `GetApiInfoUseCase` | Metadatos constantes |
| `InfoController` | `GET /api/v1/info` |

Sin dependencias. Sin PostgreSQL. Sin dominio.

---

## Separación de responsabilidades

| Endpoint | Responsabilidad | Capa |
|----------|-----------------|------|
| `GET /api/v1/operations/dashboard` | Estado operativo del edificio | Operations / Application |
| `GET /api/v1/health` | Disponibilidad técnica (DB) | Health / Application |
| `GET /api/v1/info` | Identidad y arquitectura de la API | Info / Application |

Los controllers son adaptadores delgados. Toda lógica vive en use cases de Application.

---

## Por qué Health e Info no pertenecen al bounded context Operations

1. **Lenguaje ubicuo distinto.** Operations habla de Incident, Shift, Actor, Site. Health e Info hablan de disponibilidad de infraestructura y metadatos de plataforma — conceptos transversales, no del edificio.

2. **Sin lógica de negocio.** Health ejecuta una sonda técnica; Info devuelve constantes. Ninguno consulta agregados, proyecciones ni Event Log.

3. **Evolución independiente.** Readiness/liveness, métricas Prometheus o versionado desde `package.json` pueden evolucionar sin tocar `OperationsModule`.

4. **Evitar acoplamiento.** Reutilizar `IncidentController` o `DashboardController` mezclaría concerns de observabilidad con queries operativas.

5. **Pool compartido, no dominio compartido.** Health importa solo `PostgresOperationsPool` (infraestructura transversal). No importa use cases ni repositorios de Operations.

---

## Dashboard Summary

Calculado en `buildDashboardSummary()` desde:

- Sites, assets, shifts ya cargados
- Incidents filtrados por estado
- Work orders y notifications para contadores del día

Sin consultas SQL adicionales. Trade-off: el costo crece con el volumen de datos cargados para el dashboard completo.

---

## Activity Feed

`buildActivityFeed()` mezcla las cuatro listas `recent*` del dashboard:

| Origen | `type` |
|--------|--------|
| `recentEvents` | `EVENT` |
| `recentIncidents` | `INCIDENT` |
| `recentWorkOrders` | `WORK_ORDER` |
| `recentNotifications` | `NOTIFICATION` |

Orden: `timestamp` DESC. Límite: 20 entradas (`ACTIVITY_FEED_MAX_ITEMS`).

Distinto de **Timeline** (cronológico por Incident, fuentes SQL + enriquecimiento Notification).

---

## Trade-offs

| Trade-off | Consecuencia |
|-----------|--------------|
| **Versión hardcodeada** | `0.13.0-alpha` en Health, Info y documentación; desincronización posible con `package.json` |
| **Environment fijo** | `development` en Info; no refleja despliegue real |
| **Health binario** | Solo `UP`; sin distinción degraded/down ni códigos HTTP alternativos |
| **`checks.operations` = DB** | Proxy de disponibilidad; no valida lógica de negocio Operations |
| **Activity Feed límite 20** | Sin paginación ni filtro por Site/Actor |
| **Summary en memoria** | Eficiente para MVP; no escala si el dashboard carga volúmenes grandes sin agregación SQL |
| **Info sin auth** | Metadatos públicos por diseño MVP; aceptable sin autenticación |

---

## Deuda pendiente (P2)

| Ítem | Justificación |
|------|---------------|
| Versión desde `package.json` | Constante duplicada en tres lugares |
| `environment` configurable | `NODE_ENV` o variable de despliegue no leída |
| Readiness / liveness | Un solo `/health`; K8s típicamente separa probes |
| Métricas Prometheus | Sin observabilidad de latencia, pool, counters |
| Activity Feed paginado | Límite fijo 20 |
| Dashboard Summary optimizable | Agregación SQL futura si crece volumen |

---

## P1 — Sin ítems nuevos

No se detectaron bloqueos estructurales. Los ítems P1 del backlog (Event Log incompleto, integridad referencial, concurrencia) siguen vigentes.

---

## Conclusión

Sprint 13 cierra la **capa de observabilidad transversal** del monolito: dashboard con summary y activity feed, health check de infraestructura e info pública de la API. La separación en módulos `health` e `info` preserva el bounded context `operations` intacto.

Queda deuda consciente en versionado, environment, probes K8s, métricas y límites del feed.

---

## Referencias

- Review: este documento
- Backlog: `docs/architecture_backlog.md`
- Estado: `docs/05_current_status.md`
- Glosario: `docs/glossary.md`
- Sprint 12 (queries): `docs/architecture_reviews/sprint_12_notification_queries.md`
