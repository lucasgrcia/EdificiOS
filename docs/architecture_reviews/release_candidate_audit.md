# EdificiOS Release Candidate Audit

**Versión auditada:** `0.18.0-alpha`  
**Fecha de auditoría:** 2026-07-14  
**Alcance:** `src/`, `frontend/`, `docs/`, `test/`, `scripts/`, `docker-compose.yml`, migraciones SQL  
**Metodología:** inspección estática READ-ONLY + ejecución de suite de tests backend  
**Restricción:** sin modificaciones de código ni documentación preexistente

---

## Executive Summary

EdificiOS `0.18.0-alpha` cumple el objetivo del Release Candidate: **backend operativo con dominio rico, API documentada y frontend demostrable de punta a punta**. La arquitectura del núcleo operativo (`operations`) respeta Clean Architecture de forma verificable: dominio TypeScript puro, puertos en Application, adaptadores en Infrastructure, controllers delgados.

El sistema **no está listo para producción** ni para evolución a `1.0` sin resolver deuda estructural documentada (CQRS parcial, outbox sin consumidor, VOs duplicados, auth UI desacoplada de protección real de Operations) y **sin corregir la desalineación de versión en tests** (618/621 pasando al momento de la auditoría).

**Veredicto:** RC **aprobado para demostraciones locales controladas**. Evolución hacia `1.0` requiere plan de hardening, no solo features.

| Dimensión | Evaluación breve |
|-----------|------------------|
| Núcleo backend (Incident, Event Log, Outbox write) | Bien diseñado |
| Bounded context Authentication | Bien separado; tensión con MVP público en Operations |
| Frontend RC | Estructura sólida; sin tests; auth scaffolding parcial |
| Documentación RC | Completa para demo; métricas de tests desactualizadas |
| Operaciones (versiones, migraciones) | Deuda verificable |

---

## Architecture Score

Calificación 1–10 basada en evidencia del código y documentación. No incluye estilo ni lint.

| Área | Score | Justificación |
|------|-------|---------------|
| **Backend** | **7.5** | Dominio puro, pipeline transaccional de Incident, HTTP consistente. Penaliza: `operations.module.ts` monolítico (~697 líneas), leaks menores en Application (`UnauthorizedException`, `Pool` en health). |
| **Frontend** | **6.5** | Capas claras (pages → hooks → api). Penaliza: 0 tests, auth UI vs API pública, heurística de correlación en cliente, DTOs manuales. |
| **DDD** | **7.0** | 8 agregados/entidades en operations, lenguaje ubicuo disciplinado. Penaliza: `SiteId`/`ActorId` duplicados, authentication sin capa domain. |
| **Clean Architecture** | **7.5** | Dirección `domain ← application ← infrastructure` respetada en operations. Penaliza: health acoplado a pool de operations, application importa shared cross-cutting. |
| **CQRS** | **5.5** | Separación fuerte en Incident y Notification. Penaliza: lecturas de WorkOrder/Site/Asset/Shift vía repos de comando; dashboard mezcla 7 repos. |
| **Observability** | **6.5** | Correlation ID, structured logs, métricas en memoria, propagación a Event Log/Outbox en Incident. Penaliza: sin export Prometheus, header entrante no reutilizado, Health desincronizado. |
| **Documentation** | **7.0** | Sprint 18 bien cerrado (`GUIA_USO`, review, backlog, glosario). Penaliza: `AGENTS.md` desactualizado, README detect obsoleto, claim 621/621 vs tests reales. |
| **Testing** | **6.5** | 63 suites backend, dominio y HTTP bien cubiertos. Penaliza: 3 tests fallando por versión, 0 frontend, 7 repos sin suite dedicada, migraciones sin tests. |
| **Maintainability** | **6.0** | Convenciones claras, módulos por BC. Penaliza: DI monolítico, openapi-enrichment grande (~474 líneas), dashboard use case denso (~300 líneas). |
| **Scalability** | **5.0** | Monolito modular adecuado para MVP. Penaliza: sin paginación, pools duplicados misma DB, outbox sin worker, sin rate limiting, frontend sin API URL de producción. |

**Promedio ponderado:** **6.6 / 10** — base arquitectónica sólida para RC; no para carga multi-edificio ni despliegue público sin trabajo adicional.

---

## Strengths

Fortalezas verificadas en código. No son aspiracionales.

1. **Dominio operations libre de infraestructura** — Búsqueda en `src/operations/domain/**`: cero imports de `@nestjs`, `pg`, `prisma`, `express`. Cumple `AGENTS.md` en el núcleo operativo.

2. **IncidentAggregate con comportamiento real** — `src/operations/domain/incident.ts`: ciclo de vida, `replay()`, `pullDomainEvents()`, invariantes de transición. No es CRUD anémico.

3. **Pipeline transaccional Incident bien diseñado** — `detect-incident-use-case.ts` + `incident-transition.ts` + `postgres-operations-transaction-runner.ts`: proyección + Event Log + Outbox en una transacción. Patrón Transactional Outbox aplicado correctamente en escritura.

4. **Separación HTTP command/query** — `IncidentsController` (POST) vs `IncidentQueryController` (GET); mismo patrón en `NotificationsController` vs `NotificationQueryController`.

5. **Problem Details global** — `ProblemDetailsFilter` con `correlationId`; frontend `parseApiError.ts` consume RFC 9457 sin exponer JSON crudo.

6. **Authentication bounded context aislado** — `operations` no importa `authentication`. JWT validado en `JWTAuthenticationContext`; guard solo en `GET /api/v1/authentication/me` (`authenticated-user.controller.ts`).

7. **Lenguaje ubicuo en código** — Sin `Ticket`, `Task`, `Issue`, `Attachment`, `Setting` como términos de dominio en `src/`.

8. **Suite de tests backend amplia** — 63 archivos `*.spec.ts`; cobertura de dominio (VOs, agregados), use cases, HTTP integration, JWT, Swagger, correlation-id.

9. **Frontend: separación UI/API explícita** — `pages/` → `hooks/` (TanStack Query) → `api/` (Axios). Sin imports del backend. Proxy Vite en desarrollo.

10. **Documentación RC coherente en Sprint 18** — `GUIA_USO.md`, `sprint_18_frontend_foundation.md`, sección Frontend Foundation en `05_current_status.md`, backlog frontend anclado a código real.

11. **Docker + scripts de bootstrap** — `docker-compose.yml` PostgreSQL 16 con healthcheck; `db:setup` orquesta up + wait + migrate.

12. **Swagger enriquecido** — OpenAPI documenta Operations, Health, Info, Authentication Bearer; alineado con runtime en `/me`.

---

## Findings

Cada hallazgo incluye severidad, descripción, impacto, recomendación y justificación técnica con evidencia.

### P0 — Crítico

**No se identifican hallazgos P0** que impidan usar el Release Candidate para demostraciones locales (backend + frontend + PostgreSQL en Docker).

No hay evidencia de exposición de secretos en repositorio, bypass de autenticación en endpoints protegidos (`/me` sí exige JWT), ni corrupción activa de datos en el flujo feliz de detección de incidencias. Los riesgos detectados son de **consistencia arquitectónica, operabilidad y preparación para producción**, no de bloqueo inmediato del RC de demo.

---

### P1 — Alto

#### F-01 — Tests de versión desactualizados; documentación afirma 621/621 OK

| Campo | Detalle |
|-------|---------|
| **Severity** | P1 |
| **Descripción** | `ApplicationConfig.version = '0.18.0-alpha'` pero tests esperan `0.15.0-alpha`. |
| **Evidencia** | `test/application-config.integration.spec.ts:25`, `test/info.http.integration.spec.ts:52`, `test/swagger.http.integration.spec.ts:91-93`. Ejecución auditoría: **3 failed, 618 passed, 621 total** (3 suites fallidas). |
| **Impacto** | Métrica de calidad en `05_current_status.md` y reviews es **incorrecta**. CI/release gates basados en “0 fallos” son engañosos. |
| **Recomendación** | Antes de `1.0`: actualizar assertions o centralizar versión en un único origen consumido por tests, Health e Info. |
| **Justificación** | La versión es contrato público (`GET /info`, Swagger). Tests deben reflejar el runtime o el RC no es auditable. |

#### F-02 — `ActorId` duplicado con reglas de validación incompatibles

| Campo | Detalle |
|-------|---------|
| **Severity** | P1 |
| **Descripción** | Dos clases `ActorId` en bounded contexts distintos del mismo módulo operations. |
| **Evidencia** | `domain/actor/value-objects/actor-id.ts` exige UUID; `domain/evidence/value-objects/actor-id.ts` acepta string libre. |
| **Impacto** | Evidence puede asociarse a identificadores de actor no válidos para Incident/Shift. Integridad referencial tipada rota. |
| **Recomendación** | Unificar en shared kernel o importar VO de Actor; alinear `CaptureEvidenceUseCase` y pipes HTTP. |
| **Justificación** | Misma semántica de negocio (“quien operó”) con contratos distintos viola identidad compartida en DDD. Ya documentado en `architecture_backlog.md` P1#4. |

#### F-03 — Outbox write-only: sin consumidor ni transición de estado

| Campo | Detalle |
|-------|---------|
| **Severity** | P1 |
| **Descripción** | Outbox persiste mensajes `pending`; no hay worker, scheduler ni publicador en `src/`. |
| **Evidencia** | `PostgresOutboxRepository` solo `INSERT`; tabla `outbox` con `processed_at` en `001_initial.sql`; búsqueda sin consumer. |
| **Impacto** | Event-driven incompleto: integraciones externas, buses o proyecciones asíncronas no pueden activarse sin nuevo componente. |
| **Recomendación** | Para `1.0`: implementar consumer o documentar formalmente “outbox deferred” y remover expectativa de Event Bus en metadata Info. |
| **Justificación** | Transactional Outbox sin delivery es patrón a medias; válido en walking skeleton, riesgoso si se vende como event-driven completo. |

#### F-04 — Eventos de dominio de Shift generados y descartados

| Campo | Detalle |
|-------|---------|
| **Severity** | P1 |
| **Descripción** | `StartShiftUseCase` y `CloseShiftUseCase` llaman `shift.pullDomainEvents()` sin persistir en Event Log ni Outbox. |
| **Evidencia** | `start-shift-use-case.ts:56`, `close-shift-use-case.ts:38`; agregado `ShiftAggregate` sí emite `shift.continuity.*`. |
| **Impacto** | Dos filosofías de persistencia en el mismo BC: Incident auditado; Shift no. Timeline y replay no incluyen continuidad de turno como fuente de verdad. |
| **Recomendación** | Persistir eventos Shift o dejar de emitirlos hasta que exista pipeline (evitar falsa sensación de uniformidad). |
| **Justificación** | Inconsistencia verificable con ADR-002 (Event Log como verdad) solo aplicado parcialmente. |

#### F-05 — CQRS incompleto en lecturas principales

| Campo | Detalle |
|-------|---------|
| **Severity** | P1 |
| **Descripción** | WorkOrder, Site, Asset, Actor, Shift usan repositorios de comando en paths de lectura. |
| **Evidencia** | `GetWorkOrderByIdUseCase` → `WorkOrderRepository.findById`; `WorkOrderQueryRepository` solo `findRecent()` para dashboard. `GetOperationsDashboardUseCase` mezcla 4 query + 3 command repos (~300 líneas). |
| **Impacto** | Escalar lecturas acopla queries a modelo de escritura; refactors de persistencia command afectan dashboards y listados. |
| **Recomendación** | Completar query repos o declarar oficialmente “CQRS light solo Incident/Notification” en ADR. |
| **Justificación** | Documentación y `GET /info` mencionan arquitectura event-driven/CQRS; implementación es heterogénea. |

#### F-06 — Frontend sin tests automatizados

| Campo | Detalle |
|-------|---------|
| **Severity** | P1 |
| **Descripción** | Cero archivos `*.spec.*` / `*.test.*` en `frontend/`; `package.json` sin script `test`. |
| **Evidencia** | 59 archivos en `frontend/src/`; dependencias sin Vitest/Testing Library/Playwright. |
| **Impacto** | RC UI no tiene red de seguridad ante regresiones en rutas, hooks, parseApiError, ProtectedRoute. |
| **Recomendación** | Mínimo para `1.0`: tests de `parseApiError`, `ProtectedRoute`, hooks con MSW; opcional E2E Playwright del flujo demo. |
| **Justificación** | Backend tiene 621 tests; frontend es mitad del producto demostrable sin cobertura equivalente. |

#### F-07 — Auth UI desacoplada de protección real

| Campo | Detalle |
|-------|---------|
| **Severity** | P1 |
| **Descripción** | `ProtectedRoute` exige token en cliente; dashboard e incidencias consumen `publicApiClient` sin Bearer. Backend Operations sin guards JWT. |
| **Evidencia** | `dashboard.api.ts` → `publicApiClient`; `routes/index.tsx`: solo `/dashboard` protegida; `fetchCurrentUser` en `auth.api.ts` sin uso. |
| **Impacto** | Falsa sensación de seguridad en demo; JWT integration preparada pero no ejercida en flujo principal. |
| **Recomendación** | Para `1.0`: alinear producto — o proteger Operations en backend y usar `authenticatedApiClient`, o simplificar UI quitando auth scaffolding hasta login real. |
| **Justificación** | Tensión intencional en MVP documentada, pero es riesgo de evolución si no se resuelve antes de producción. |

#### F-08 — Versiones runtime divergentes (Health vs ApplicationConfig)

| Campo | Detalle |
|-------|---------|
| **Severity** | P1 |
| **Descripción** | Health reporta versión distinta al resto de la plataforma. |
| **Evidencia** | `application-config.ts:4` → `0.18.0-alpha`; `get-health-use-case.ts:5` → `HEALTH_VERSION = '0.13.0-alpha'`. |
| **Impacto** | Observabilidad y operadores ven versiones contradictorias; confusión en despliegues y soporte. |
| **Recomendación** | Consumir `ApplicationConfig.version` desde Health o documentar como métrica independiente con semántica clara. |
| **Justificación** | Deuda ya declarada en docs; sigue siendo hallazgo verificable para RC audit. |

#### F-09 — Provider DI duplicado en OperationsModule

| Campo | Detalle |
|-------|---------|
| **Severity** | P1 |
| **Descripción** | `PostgresIncidentTimelineRepository` registrado dos veces con idéntico `useFactory`. |
| **Evidencia** | `operations.module.ts:235-245` — dos bloques `provide: PostgresIncidentTimelineRepository`. |
| **Impacto** | Segunda definición sobrescribe la primera en NestJS; señal de error de mantenimiento; riesgo de wiring incorrecto en futuros refactors del módulo. |
| **Recomendación** | Eliminar registro duplicado en próximo PR de mantenimiento (fuera de alcance de esta auditoría). |
| **Justificación** | Módulo de 697 líneas ya es punto único de fallo; duplicación aumenta probabilidad de regresiones silenciosas. |

---

### P2 — Medio

#### F-10 — `SiteId` duplicado (copias literales)

| Campo | Detalle |
|-------|---------|
| **Severity** | P2 |
| **Evidencia** | `domain/site/value-objects/site-id.ts` y `domain/shift/value-objects/site-id.ts`. |
| **Impacto** | `equals()` no cruza tipos; refactors de Site pueden desalinear Shift sin error de compilación semántica. |
| **Recomendación** | Un único `SiteId` compartido. Backlog P1#3. |

#### F-11 — Application layer acoplada a framework/infra

| Campo | Detalle |
|-------|---------|
| **Severity** | P2 |
| **Evidencia** | `get-current-user-use-case.ts` importa `UnauthorizedException` de `@nestjs/common`; `get-health-use-case.ts` importa `Pool` de `pg`. |
| **Impacto** | Application no es portable; tests requieren mocks de framework. |
| **Recomendación** | Excepciones de dominio/aplicación propias; puerto `HealthCheckPort` sin `pg` en application. |

#### F-12 — HealthModule acoplado a OperationsModule

| Campo | Detalle |
|-------|---------|
| **Severity** | P2 |
| **Evidencia** | `health.module.ts` importa `OperationsModule` y `PostgresOperationsPool`. |
| **Impacto** | Health no es transversal puro; arranque y tests de health dependen del BC operations. |
| **Recomendación** | Abstraer check de DB en puerto compartido o módulo `database` transversal. |

#### F-13 — Correlation ID no reutiliza header entrante

| Campo | Detalle |
|-------|---------|
| **Severity** | P2 |
| **Evidencia** | `correlation-id.middleware.ts` genera siempre `randomUUID()`; `CORRELATION_ID_HEADER` definido pero no leído del request. |
| **Impacto** | Trazabilidad punta a punta con cliente/proxy externo limitada. |
| **Recomendación** | Aceptar `x-correlation-id` entrante si presente; propagar en respuesta (parcialmente hecho). |

#### F-14 — Heurística `resolveIncidentIdForFeedEntry` en frontend

| Campo | Detalle |
|-------|---------|
| **Severity** | P2 |
| **Evidencia** | `frontend/src/utils/resolveIncidentIdForFeedEntry.ts` correlaciona por description + actorId + timestamp; `ActivityFeedEntry` sin `incidentId`. |
| **Impacto** | Colisiones si dos incidencias comparten descripción y actor en ventana temporal. |
| **Recomendación** | Para `1.0`: extender DTO backend o aceptar enlaces solo cuando correlación es unívoca. |

#### F-15 — Migraciones sin tracking ni idempotencia

| Campo | Detalle |
|-------|---------|
| **Severity** | P2 |
| **Evidencia** | `scripts/migrate.js` aplica todos los SQL sin tabla `schema_migrations`; SQL usa `CREATE TABLE` sin `IF NOT EXISTS`. |
| **Impacto** | Re-ejecutar `db:migrate` falla; entornos parcialmente migrados difíciles de recuperar. |
| **Recomendación** | Tabla de control de versiones + migraciones idempotentes o transaccionales. |

#### F-16 — Repositorios Postgres sin suite dedicada (7)

| Campo | Detalle |
|-------|---------|
| **Severity** | P2 |
| **Evidencia** | Sin `test/postgres-*` para: flow-event, outbox, event-query, work-order-query, notification-query, user-repository, user-query-repository. |
| **Impacto** | Huecos en CI para adaptadores críticos (outbox, notification query). |
| **Recomendación** | Suites de integración por repositorio siguiendo patrón existente. |

#### F-17 — `operations.module.ts` monolítico

| Campo | Detalle |
|-------|---------|
| **Severity** | P2 |
| **Evidencia** | ~697 líneas; 13+ controllers, ~30 use cases, ~15 repos en un solo `@Module`. |
| **Impacto** | Tiempo de compilación DI, conflictos en PRs paralelos, curva de onboarding. |
| **Recomendación** | Submódulos Nest por agregado o por capa HTTP (commands/queries) cuando el equipo crezca. |

#### F-18 — Documentación constitucional desalineada (`AGENTS.md`)

| Campo | Detalle |
|-------|---------|
| **Severity** | P2 |
| **Evidencia** | `AGENTS.md`: “No agregar autenticación”, “No agregar CQRS”; sistema tiene BC authentication JWT y CQRS ligero en Notification. |
| **Impacto** | Agentes IA y nuevos contribuidores aplican reglas obsoletas. |
| **Recomendación** | Actualizar constitución o separar “MVP original” vs “estado RC 0.18”. |

#### F-19 — README ejemplo de detección obsoleto

| Campo | Detalle |
|-------|---------|
| **Severity** | P2 |
| **Evidencia** | `README.md` curl de detect solo `{ "description" }`; código exige `assetId` + Shift activo (`DetectIncidentUseCase`). |
| **Impacto** | Onboarding falla en primer contacto si se sigue README en lugar de `GUIA_USO.md`. |
| **Recomendación** | Alinear README con `GUIA_USO.md` y Swagger. |

---

### P3 — Bajo

#### F-20 — Authentication sin capa domain

| Campo | Detalle |
|-------|---------|
| **Severity** | P3 |
| **Evidencia** | `src/authentication/` solo `application/` + `infrastructure/`; `UserRecord` anémico. |
| **Impacto** | Aceptable para MVP de identidad; limita reglas de negocio de usuario futuras. |

#### F-21 — Dos pools PostgreSQL a misma `DATABASE_URL`

| Campo | Detalle |
|-------|---------|
| **Severity** | P3 |
| **Evidencia** | `PostgresOperationsPool` y `PostgresAuthenticationPool` instancian `Pool` separados. |
| **Impacto** | Overhead de conexiones en dev; irrelevante en RC local. |

#### F-22 — DTOs frontend subconjunto manual de backend

| Campo | Detalle |
|-------|---------|
| **Severity** | P3 |
| **Evidencia** | `frontend/src/types/dashboard.ts` omite campos de `dashboard-view.ts` (`sites`, `openIncidents`, etc.). |
| **Impacto** | TypeScript no detecta drift si backend agrega campos obligatorios. |

#### F-23 — Metadata Info declara "Event Sourcing" completo

| Campo | Detalle |
|-------|---------|
| **Severity** | P3 |
| **Evidencia** | `get-api-info-use-case.ts` lista principios incluyendo event sourcing; implementación es projection + event log parcial. |
| **Impacto** | Expectativas infladas en auditores externos. |

#### F-24 — Docker solo PostgreSQL

| Campo | Detalle |
|-------|---------|
| **Severity** | P3 |
| **Evidencia** | `docker-compose.yml` un servicio `postgres`. |
| **Impacto** | Aceptable para RC; despliegue requiere orquestación manual API + frontend. |

#### F-25 — Backlog P1#15 obsoleto (Field Story 006)

| Campo | Detalle |
|-------|---------|
| **Severity** | P3 |
| **Evidencia** | `architecture_backlog.md` cita desalineación de nombres de eventos; `field_stories/006` ya usa `shift.continuity.*`. |
| **Impacto** | Ruido en priorización de deuda. |

---

## Technical Debt

Solo deuda **comprobable** en código o scripts. Consolidada con `architecture_backlog.md`; no se inventan ítems nuevos.

### Backend / dominio

| Deuda | Evidencia | Prioridad documentada |
|-------|-----------|----------------------|
| Event Log `workflow.flow.detected` sin contexto operativo completo | `incident-detected.ts` payload; `replay()` nulls | P1 backlog #1 |
| Integridad referencial asimétrica | `StartShiftUseCase` sin validar Site; `ListAssetsBySiteUseCase` sin 404 site | P1 backlog #2 |
| `SiteId` / `ActorId` duplicados | Archivos VO duplicados | P1 backlog #3–4 |
| Concurrencia optimista ausente | Sin `WHERE status` en transiciones | P1 backlog #5 |
| Outbox sin consumer | Solo INSERT | F-03 |
| Shift events descartados | `pullDomainEvents()` sin persist | F-04 |
| CQRS parcial | WorkOrder reads vía command repo | F-05 |
| Health version `0.13.0-alpha` | Constante hardcodeada | F-08 |
| `ApplicationConfig` hardcodeado | JWT secret, environment en código | P2 backlog Sprint 15 |
| Evidence sin validar evento existente | `CaptureEvidenceUseCase` | P1 backlog #9 |
| Tests versión `0.15.0-alpha` | 3 tests fallando | F-01 |

### Frontend

| Deuda | Evidencia |
|-------|-----------|
| Login real | `LoginPage` JWT manual |
| Refresh token | `localStorage` sin rotación |
| Actor selector | `useDashboard()` sin `actorId` |
| CRUD Incident / Assets desde UI | Solo lectura |
| Filtros y paginación | Límites fijos backend |
| Tests E2E / unit frontend | 0 archivos test |
| API URL producción | `baseURL: '/api/v1'` fijo |
| Heurística feed → incident | `resolveIncidentIdForFeedEntry.ts` |

### Operaciones / tooling

| Deuda | Evidencia |
|-------|-----------|
| Migraciones sin tracking | `migrate.js` |
| `wait-for-postgres.js` no carga `.env` | Fallback hardcodeado |
| Provider duplicado timeline | `operations.module.ts:235-245` |

---

## Release Readiness

### ¿Está preparado para una Release Candidate?

**Sí**, con reservas explícitas.

| Criterio RC | Estado |
|-------------|--------|
| Backend funcional con tests mayoritarios | ✔ (618/621; 3 fallos de versión) |
| Frontend demostrable E2E local | ✔ (`GUIA_USO.md` verificado en uso real) |
| API documentada (Swagger) | ✔ |
| Arquitectura explicable y revisada | ✔ (reviews Sprint 10–18) |
| Documentación de limitaciones | ✔ |
| Sin P0 de seguridad/datos en flujo demo | ✔ |

**Reservas:** métrica “621/621” incorrecta hoy; auth UI no refleja modelo de seguridad final; migraciones frágiles ante re-ejecución.

### ¿Está preparado para producción?

**No.**

| Bloqueante producción | Razón |
|----------------------|-------|
| Operations API pública | Sin autorización por endpoint |
| JWT / login incompletos | Sin credenciales, refresh, rotación |
| Outbox sin delivery | Sin integración asíncrona confiable |
| Health/versión incoherente | Operación y soporte degradados |
| Frontend sin tests | Regresiones UI no detectables |
| Sin despliegue documentado | Proxy Vite solo dev; sin CORS/API URL prod |
| Secretos hardcodeados | `jwtSecret` en `ApplicationConfig` |
| Migraciones no idempotentes | Riesgo en deploys repetidos |

### ¿Qué falta para 1.0?

Orden sugerido por dependencia, no por prioridad de negocio:

1. **Integridad de release** — Alinear versión en tests, Health, Info, Swagger; CI verde real.
2. **Identidad** — Login real, emisión JWT, refresh, protección progresiva de Operations.
3. **Consistencia DDD** — Unificar `SiteId`, `ActorId`; cerrar brecha Event Log / replay.
4. **CQRS explícito** — Completar query repos o acotar contrato arquitectónico en ADR.
5. **Event-driven** — Consumidor outbox o retirar expectativa; persistir o eliminar eventos Shift.
6. **Frontend hardening** — Tests, auth alineada, eliminar heurísticas frágiles, CRUD mínimo operativo.
7. **Operaciones** — Migration tracking, configuración por entorno, despliegue containerizado API+DB.
8. **Observabilidad producción** — Métricas exportables, correlation header bidireccional.
9. **Documentación** — `AGENTS.md`, README y backlog sincronizados con RC.

---

## Conclusion

EdificiOS `0.18.0-alpha` **cumple el mandato del Release Candidate**: demuestra un edificio digital operable con backend event-aware en el núcleo de incidencias, API REST documentada y frontend React conectado sin alterar contratos. La arquitectura del bounded context `operations` está **bien diseñada** para un walking skeleton maduro: dominio puro, puertos explícitos, transacciones correctas en el flujo crítico de detección.

La auditoría **no autoriza evolución a producción ni a 1.0** sin abordar deuda P1 verificable: tests de versión fallando, VOs duplicados, outbox incompleto, CQRS heterogéneo, frontend sin red de tests y autenticación UI desacoplada de la superficie API real.

**Veredicto final:** **RC APROBADO para demostraciones y validación de campo.** **HOLD para producción.** La base arquitectónica justifica inversión en hardening; el producto no requiere reescritura, sino **cierre disciplinado de deuda documentada** antes de declarar `1.0`.

---

**Auditoría realizada por:** revisión arquitectónica independiente (READ-ONLY)  
**Evidencia de tests:** `npm test` → 63 suites, 621 tests, **3 failed** (versión), 618 passed  
**Próximo artefacto sugerido:** plan de hardening pre-1.0 derivado de hallazgos P1 (fuera de alcance de esta auditoría)
