# Glosario — Lenguaje ubicuo de EdificiOS

Fuente canónica de términos del dominio. Supersede `docs/03_glossary.md` (parcial y desactualizado).

Usar estos términos en código, documentación, Field Stories y Architecture Reviews. Las traducciones al español del día a día del edificio (encargado, portero) son narrativas; el modelo habla el idioma de esta tabla.

---

## Agregados y entidades

### Site

El edificio como unidad operativa explícita. Agregado raíz inmutable (`register`, `rehydrate`). Todo Asset, Shift y Actor operan dentro de un Site.

**No usar:** Sitio (solo en narrativa de usuario si no hay alternativa), Building como identificador de código.

**Persistencia:** tabla `sites`. Sin Domain Events en el MVP actual.

---

### Asset

Activo físico del edificio (bomba, ascensor, sistema de piscina). Agregado raíz inmutable. Pertenece obligatoriamente a un Site existente.

**No usar:** Equipment, Resource, Device como nombre de agregado.

**Referencia:** `SiteId` por identidad; Site no conoce sus Assets.

---

### Actor

Persona que opera el edificio durante un Turno (portero, administrador, seguridad, técnico). Agregado raíz inmutable. Se registra en un Site.

**No usar:** User, Operator, Guardia, Empleado como nombre de dominio.

**Roles MVP:** `PORTER`, `ADMINISTRATOR`, `SECURITY`, `TECHNICIAN`.

**Estados:** `ACTIVE`, `INACTIVE`.

---

### Shift

Turno operativo. Ventana de continuidad en la que el edificio está atendido. Agregado con ciclo `OPEN → CLOSED`. Un solo Shift `OPEN` por Site.

**No usar:** Guardia, Turn (en código), Schedule.

**Eventos de dominio:** `shift.continuity.started`, `shift.continuity.closed`.

**Al iniciar:** se asocia un `Actor` (`actorId`). Ese Actor es quien representa la continuidad del Turno.

---

### Incident

Problema operativo detectado en el edificio. Agregado con ciclo de vida:

```
DETECTED → ASSIGNED → IN_PROGRESS → RESOLVED
```

**No usar:** Ticket, Task, Issue, Case.

**Eventos de dominio (Flow):** `workflow.flow.detected`, `workflow.flow.assigned`, `workflow.flow.execution_started`, `workflow.flow.resolved`.

**Contexto en detección:** requiere Asset existente, Shift activo del Site del Asset, y Actor resuelto desde ese Shift. El cliente no envía `actorId` al detectar.

**Campos de proyección relevantes:**

| Campo | Significado |
|-------|-------------|
| `actorId` | Actor del Turno al momento de la detección |
| `assignedActorId` | Actor al que se asignó el Incident en la transición `assign` |
| `assetId` | Asset sobre el que se detectó |
| `shiftId` | Shift activo al detectar |

---

### Evidence

Prueba física capturada durante un Turno (foto, video, audio). Entidad inmutable. **No pertenece a Incident**; respalda un Domain Event (ADR-006).

**No usar:** Attachment, File, Media como nombre de dominio.

**Campos:** `evidenceId`, `actorId` (quien capturó), `storageReference`, `mimeType`, `caption`, `capturedAt`.

---

### WorkOrder

Orden de trabajo derivada de un Incident. Agregado raíz independiente con ciclo:

```
OPEN → IN_PROGRESS → COMPLETED
OPEN / IN_PROGRESS → CANCELLED
```

**No usar:** Task, Ticket, Job como nombre de dominio.

**Relación con Incident:** por `incidentId` (referencia por identidad). Incident **no conoce** WorkOrder; la integración vive en Application (`CreateWorkOrderFromIncidentUseCase`).

**Regla:** un solo WorkOrder `OPEN` por Incident.

**Estados:** `OPEN`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.

---

### Notification

Mensaje operativo generado **automáticamente por la aplicación** para informar a un Actor sobre un hito relevante del flujo operativo.

**No usar:** Alert, Message, PushNotification como nombre de dominio.

**Bounded context:** Operations.

**No participa del Event Log.** No modifica agregados operativos (Incident, WorkOrder). No genera transiciones de dominio. Es una integración **Application → Notification** vía `CreateNotificationUseCase`, siempre post-persistencia exitosa.

**Puede originarse por:**

- Incident detectado (`DetectIncidentUseCase`)
- Incident asignado (`AssignIncidentUseCase`)
- Incident resuelto (`ResolveIncidentUseCase`)
- WorkOrder iniciada (`StartWorkOrderUseCase`)
- WorkOrder completada (`CompleteWorkOrderUseCase`)
- Creación manual (`POST /api/v1/operations/notifications`)

**Importante:** no representa envío real (email, push, websocket). Representa una **intención de notificación persistida** en tabla `notifications`.

**Relación con Actor:** `recipientId` (UUID del Actor destinatario). Notification **no conoce** Incident ni WorkOrder; las integraciones viven en Application.

**Estados:** `PENDING`, `SENT`, `FAILED`, `READ` (sin transiciones ni mark as read en el MVP actual).

**Canales MVP:** `IN_APP`, `EMAIL`, `PUSH` (canal almacenado; integraciones automáticas usan `IN_APP`; sin delivery real).

**Tipos operativos actuales:**

| Type | Origen |
|------|--------|
| `INCIDENT_DETECTED` | `DetectIncidentUseCase` |
| `INCIDENT_ASSIGNED` | `AssignIncidentUseCase` |
| `INCIDENT_RESOLVED` | `ResolveIncidentUseCase` |
| `WORK_ORDER_STARTED` | `StartWorkOrderUseCase` |
| `WORK_ORDER_COMPLETED` | `CompleteWorkOrderUseCase` |

**Persistencia:** tabla `notifications`. Sin Domain Events en el MVP actual.

**Lectura (Sprint 12):** `NotificationView` vía `NotificationQueryRepository`. HTTP Query separado del POST de creación.

**Diferencia con otros conceptos:**

| Concepto | Rol | Persistencia |
|----------|-----|--------------|
| **Notification** | Mensaje operativo dirigido a un Actor | Tabla `notifications` |
| **Timeline Entry** | Visualización cronológica de un hecho en el contexto de un Incident | No se persiste; se compone en lectura |
| **Event Log** | Auditoría de transiciones de dominio (Incident, Shift) | Tabla `events` append-only |

Una Notification **puede aparecer** en el Timeline como entrada `type: NOTIFICATION`, pero **no pertenece** al Event Log. El Event Log registra Domain Events (`workflow.flow.*`); las Notifications son intenciones operativas independientes generadas en Application.

---

## Conceptos transversales

### Health Check

Verificación de **disponibilidad técnica** del sistema. Responde si la infraestructura mínima funciona (conectividad PostgreSQL vía `SELECT 1`).

**No es:** un endpoint de negocio, un dashboard ni metadatos de la API.

**Módulo:** `src/health/` (independiente del bounded context `operations`).

**HTTP:** `GET /api/v1/health` → `{ status, timestamp, version, checks: { database, operations } }`.

**Regla MVP:** `status = UP` solo si el pool PostgreSQL responde. `checks.operations = UP` si la consulta fue exitosa (sin inspeccionar tablas ni ejecutar lógica de negocio).

---

### API Info

Metadatos **públicos y estáticos** de la API. Describe qué es el sistema, su versión y principios arquitectónicos.

**No es:** un health check ni un resumen operativo del edificio.

**Módulo:** `src/info/` (independiente del bounded context `operations`).

**HTTP:** `GET /api/v1/info` → `{ name, version, environment, boundedContext, architecture }`.

**Regla MVP:** sin dependencias, sin PostgreSQL, sin dominio. Toda la información es constante en Application.

---

### Dashboard Summary

Bloque `summary` dentro de `DashboardView`. Totales operativos agregados para la vista de mando.

**Campos:** `totalSites`, `totalAssets`, `activeShifts`, `openIncidents`, `inProgressIncidents`, `resolvedToday`, `openWorkOrders`, `completedToday`, `pendingNotifications`.

**Origen:** calculado en `GetOperationsDashboardUseCase` desde datos ya cargados por query repositories. Sin SQL nuevo.

**No confundir con:** Health Check (disponibilidad técnica) ni API Info (metadatos estáticos).

---

### Activity Feed

Lista `activityFeed` dentro de `DashboardView`. Feed de actividad reciente mezclando hechos operativos.

**Entrada (`ActivityFeedEntry`):** `timestamp`, `type`, `title`, `description`, `actorId?`.

**Tipos:** `EVENT`, `INCIDENT`, `WORK_ORDER`, `NOTIFICATION`.

**Origen:** merge de `recentEvents`, `recentIncidents`, `recentWorkOrders`, `recentNotifications`; orden DESC; máximo 20 entradas.

**No usar en dominio:** no es un agregado ni un término de Event Log. Es composición de lectura en Dashboard (distinto de **Timeline**, que es cronológico por Incident).

---

### Health vs Info vs Dashboard

| Concepto | Pregunta que responde | Consulta DB | Bounded context |
|----------|----------------------|-------------|-----------------|
| **Health Check** | ¿El sistema puede operar? | Sí (`SELECT 1`) | Transversal (`health`) |
| **API Info** | ¿Qué es esta API? | No | Transversal (`info`) |
| **Dashboard** | ¿Qué está pasando en el edificio? | Sí (query repositories) | `operations` |

**Health** verifica conectividad. **Info** describe la API. **Dashboard** resume el estado operativo (incidencias, turnos, summary, activity feed).

---

### Correlation ID

Identificador único por request HTTP que permite correlacionar logs, métricas y persistencia de una misma operación.

**Módulo:** `src/shared/correlation-id.ts` + `CorrelationIdMiddleware`.

**Mecanismo:** `AsyncLocalStorage`; el middleware genera UUID y lo expone vía `CorrelationIdProvider.get()`.

**Propagación:** use cases Incident persisten el mismo UUID en `events.correlation_id` y `outbox.correlation_id`.

**Header HTTP:** `x-correlation-id` en la respuesta.

**No confundir con:** `flowId` (identificador del Domain Event en el agregado Incident).

---

### Application Logger

Logger estructurado reutilizable para Application. No reemplaza el logger de NestJS.

**Módulo:** `src/shared/logging/application-logger.ts`.

**Dependencias:** `CorrelationIdProvider`, `Clock`.

**Formato:** cada entrada es un objeto JSON con `timestamp`, `level`, `correlationId`, `message`. Sin texto libre.

**Niveles MVP:** `INFO` (inicio y éxito), `ERROR` (excepción).

---

### Structured Log

Entrada de log con campos tipados: `{ timestamp, level, correlationId, message }`.

**No confundir con:** Event Log (tabla `events`, Domain Events de dominio) ni con logs de infraestructura NestJS.

---

### Application Metrics

Servicio de contadores en memoria para Application.

**Módulo:** `src/shared/metrics/application-metrics.ts`.

**API:** `increment()`, `get()`, `snapshot()`, `reset()` (reset solo para tests).

**Métricas Incident MVP:** `incident.detect.success/failure`, `incident.assign.success/failure`, `incident.start.success/failure`, `incident.resolve.success/failure`.

**No es:** Prometheus, OpenTelemetry ni persistencia de series temporales.

---

### Tracing

Capacidad de seguir una operación HTTP a través de las capas del sistema.

**MVP:** implementado vía Correlation ID propagado a logs, métricas, Event Log y Outbox.

**No es:** distributed tracing completo (spans, OpenTelemetry, Jaeger).

---

### Observability

Conjunto de capacidades transversales para entender el comportamiento del sistema en runtime.

**Componentes MVP (Sprint 14):**

| Capa | Componente |
|------|------------|
| Tracing | Correlation ID |
| Logging | Application Logger (structured logs) |
| Metrics | Application Metrics (contadores en memoria) |
| Persistencia | Event Log + Outbox (`correlation_id`) |

**Flujo:**

```
Correlation ID → Application Logger → Application Metrics → Event Log → Outbox
```

---

### Event Log vs Application Logs vs Metrics

| Concepto | Qué registra | Dónde vive | Propósito |
|----------|--------------|------------|-----------|
| **Event Log** | Domain Events irreversibles (`workflow.flow.*`) | Tabla `events` (append-only) | Fuente de verdad del dominio (ADR-002) |
| **Application Logs** | Hitos operativos del use case (start, success, error) | stdout JSON vía `ApplicationLogger` | Diagnóstico en runtime con `correlationId` |
| **Application Metrics** | Contadores success/failure por operación | Memoria (`ApplicationMetrics`) | Señales agregadas de salud operativa |

El Event Log **no** reemplaza logs de aplicación ni métricas. Los tres se complementan: el Event Log audita transiciones de dominio; los logs estructurados diagnostican ejecución; las métricas agregan éxito/fallo.

---

### Problem Details

Formato estándar de respuesta de error HTTP definido en **RFC 9457**. En EdificiOS, todo error HTTP se serializa como `application/problem+json`.

**Campos MVP:** `type` (URI estable), `title`, `status`, `detail`, `instance` (URL del request), `correlationId`.

**Módulo:** `src/shared/http/problem-details.ts`, `problem-details.filter.ts`.

**No confundir con:** body de error ad-hoc de NestJS ni mensajes de validación sin estructura.

---

### RFC 9457

Estándar IETF que define **Problem Details for HTTP APIs**. Reemplaza respuestas de error inconsistentes por un contrato JSON predecible.

**En EdificiOS:** `ProblemDetailsFilter` global transforma excepciones HTTP conocidas en Problem Details. Content-Type: `application/problem+json`.

---

### HTTP Validation

Capa global de validación HTTP que aplica reglas comunes antes de los Request Pipes específicos.

**Módulo:** `src/shared/http/http-validation.ts`, `http-validation.pipe.ts`.

**Responsabilidades MVP:**

- Validar `Content-Type: application/json` cuando hay body
- Aceptar GET sin body
- Rechazar body `null`
- Rechazar payload que no sea objeto JSON

**Alcance:** solo parámetros `@Body()`. No reemplaza pipes de ruta (`DetectIncidentRequestPipe`, etc.).

---

### Swagger

Herramienta de documentación interactiva que consume una especificación OpenAPI y expone una UI en el navegador.

**En EdificiOS:** `GET /api/docs` (Swagger UI). Generada por `@nestjs/swagger` en `setupSwagger`.

**No es:** la fuente de verdad del contrato (esa es la spec OpenAPI JSON).

---

### OpenAPI

Especificación estándar (antes Swagger Spec) para describir APIs REST: paths, métodos, schemas, responses.

**En EdificiOS:** `GET /api/docs-json`. Documenta todos los endpoints Operations, Health e Info; DTOs HTTP; respuestas de error como Problem Details.

---

### ApplicationConfig

Configuración centralizada de la aplicación. Singleton inyectable vía `ApplicationConfigModule` (`@Global()`).

**Módulo:** `src/config/application-config.ts`.

**Propiedades MVP:** `name`, `version`, `environment`, `apiPrefix`, `swaggerPath`, `jwtSecret`, `jwtIssuer`, `jwtAudience`, `jwtExpiration`.

**Consumidores:** `GetApiInfoUseCase`, `setupSwagger`. Independiente de Operations.

**No confundir con:** Policy (regla de negocio) ni variables de entorno (deuda futura).

---

### Authentication Context

Puerto de Application que resuelve **quién es el usuario actual** en un request HTTP.

**Interfaz:** `getCurrentUserId(): string | null`.

**Módulo:** `src/authentication/application/authentication-context.ts`.

**Implementación actual (Sprint 17):** `JWTAuthenticationContext` — valida JWT y extrae claim `userId`.

**No confundir con:** `JwtAuthenticationGuard` (capa HTTP que exige identidad) ni `Actor` (Operations).

---

### JWTAuthenticationContext

Implementación de `AuthenticationContext` basada en JWT.

**Módulo:** `src/authentication/infrastructure/http/jwt-authentication-context.ts`.

**Comportamiento:**
- Lee `Authorization: Bearer <token>` vía `AuthenticationHttpContext`
- Valida JWT con `@nestjs/jwt` y configuración de `ApplicationConfig`
- Extrae claim `userId` (UUID)
- Devuelve `string | null` — **sin lanzar excepciones**

**No hace:** emitir tokens, login, ni proteger endpoints HTTP (eso es responsabilidad del guard).

---

### JwtAuthenticationGuard

Guard HTTP de NestJS que exige autenticación en endpoints protegidos.

**Módulo:** `src/authentication/infrastructure/http/jwt-authentication.guard.ts`.

**Dependencia única:** `AuthenticationContext` (no valida JWT directamente).

**Comportamiento:**
- `getCurrentUserId() === null` → `UnauthorizedException`
- UUID válido → permite continuar

**Aplicado en Sprint 17:** `GET /api/v1/authentication/me` únicamente.

---

### Bearer Authentication

Esquema de seguridad HTTP documentado en OpenAPI/Swagger.

**Formato:** `Authorization: Bearer <token>`

**OpenAPI:** `type: http`, `scheme: bearer`, `bearerFormat: JWT`.

**Runtime:** `JWTAuthenticationContext` parsea y valida el token; el guard exige presencia de identidad en `/me`.

**Documentación:** esquema Bearer en `setup-swagger.ts`; `GET /me` marcado como protegido en Sprint 17 PR4.

---

### JWT

JSON Web Token usado como mecanismo de autenticación en el bounded context Authentication.

**Claim MVP:** `userId` (UUID del usuario en tabla `users`).

**Configuración:** `ApplicationConfig` — `jwtSecret`, `jwtIssuer`, `jwtAudience`, `jwtExpiration`.

**Sprint 17:** validación en runtime vía `JWTAuthenticationContext`; **sin emisión** de tokens ni endpoint de login.

---

### Authenticated User

Vista de lectura (`AuthenticatedUserView`) que representa un usuario persistido en la tabla `users`.

**Campos:** `id`, `email`, `displayName`, `status`, `createdAt`.

**No confundir con:** Actor (persona operativa del edificio en bounded context Operations).

---

### Current User

Usuario autenticado **en el contexto del request actual**, expuesto vía `GET /api/v1/authentication/me`.

**Use case:** `GetCurrentUserUseCase` — lee `AuthenticationContext`, delega a `GetAuthenticatedUserUseCase`.

**Protección HTTP (Sprint 17):** `JwtAuthenticationGuard` + JWT Bearer obligatorio.

**No es:** login ni sesión; solo resolución de identidad desde el contexto.

---

### User Query Model

Capa de lectura CQRS del bounded context Authentication.

**Componentes:** `UserQueryRepository`, `PostgresUserQueryRepository`, `GetAuthenticatedUserUseCase`, `AuthenticatedUserView`.

**HTTP:** `GET /api/v1/authentication/users/:id`.

---

### User Command Model

Capa de escritura CQRS del bounded context Authentication.

**Componentes:** `UserPersistence`, `PostgresUserRepository`, `UserRecord`, `CreateUserUseCase`.

**HTTP:** `POST /api/v1/authentication/users`.

---

### Stub Authentication

Implementación temporal de `AuthenticationContext` usada en Sprint 16.

**Estado:** eliminada en Sprint 17; sustituida por `JWTAuthenticationContext`.

**Histórico:** `StubAuthenticationContext` devolvía UUID fijo sin leer headers.

---

### AuthenticationContext vs JWTAuthenticationContext vs JwtAuthenticationGuard

| Concepto | Responsabilidad | Valida JWT | Lanza excepciones | Capa |
|----------|-----------------|------------|-------------------|------|
| **AuthenticationContext** | Contrato: resolver `userId` del request | No (es interfaz) | No | Application (puerto) |
| **JWTAuthenticationContext** | Leer Bearer, validar JWT, extraer `userId` | Sí | No — devuelve `null` | Infrastructure |
| **JwtAuthenticationGuard** | Exigir identidad antes del handler HTTP | No — delega al contexto | Sí — `UnauthorizedException` | Infrastructure (HTTP) |

**Flujo `GET /me`:**

```
Authorization: Bearer <JWT>
    ↓
AuthenticationContextMiddleware
    ↓
JwtAuthenticationGuard → AuthenticationContext.getCurrentUserId()
    ↓ (si UUID)
GetCurrentUserUseCase → GetAuthenticatedUserUseCase → AuthenticatedUserView
```

El use case **no** conoce JWT ni guards. El guard **no** parsea tokens.

---

### Authentication Context vs JWT Provider vs Controller vs Use Case

| Concepto | Responsabilidad | Cuándo actúa | Dónde vive |
|----------|-----------------|--------------|------------|
| **Authentication Context** | Resolver el `userId` del request actual | Antes del use case de current user | `application/authentication-context.ts` + `JWTAuthenticationContext` |
| **JWTAuthenticationContext** | Validar token Bearer y extraer `userId` | Implementación del puerto en runtime | `infrastructure/http/jwt-authentication-context.ts` |
| **JwtAuthenticationGuard** | Bloquear HTTP sin identidad | Antes del handler en `/me` | `infrastructure/http/jwt-authentication.guard.ts` |
| **Controller** | Adaptar HTTP → command/query; sin lógica de negocio | En el borde HTTP | `infrastructure/http/authenticated-user.controller.ts` |
| **Use Case** | Orquestar context + repositorios; reglas de aplicación mínimas | Application layer | `application/get-current-user-use-case.ts`, etc. |

**Flujo Current User:**

```
GET /me → Controller → GetCurrentUserUseCase
              → AuthenticationContext.getCurrentUserId()
              → GetAuthenticatedUserUseCase.execute(userId)
              → AuthenticatedUserView
```

El controller **no** valida JWT. El use case **no** parsea headers. El guard delega identidad al contexto.

---

### Validation vs Problem Details vs Swagger vs Configuration

| Concepto | Responsabilidad | Cuándo actúa | Dónde vive |
|----------|-----------------|--------------|------------|
| **HTTP Validation** | Validar forma del request HTTP (Content-Type, body JSON objeto) | Antes del controller, en `@Body()` | `src/shared/http/http-validation.*` |
| **Request Pipes** | Validar semántica del DTO por endpoint (`assetId` requerido, etc.) | Después de HTTP Validation, en `@Body()` / `@Param()` / `@Query()` | `src/operations/infrastructure/http/*-request.pipe.ts` |
| **Problem Details** | Serializar errores HTTP en contrato RFC 9457 | Al lanzar excepción (catch global) | `src/shared/http/problem-details.*` |
| **Swagger / OpenAPI** | Documentar contrato de la API (métodos, bodies, responses) | Solo lectura; no ejecuta en runtime de negocio | `src/shared/http/swagger/` |
| **ApplicationConfig** | Centralizar metadatos de plataforma (nombre, versión, paths) | Bootstrap + endpoints Info/Swagger | `src/config/` |

**Flujo resumido:**

```
Request → HTTP Validation → Request Pipes → Controller → Use Case
                                              ↓ (error)
                                        Problem Details
Documentación: Swagger/OpenAPI (paralela, no interviene en el flujo de negocio)
Metadatos: ApplicationConfig (nombre, versión, rutas de docs)
```

---

### Flow

El ciclo de trabajo asociado a un Incident. En el MVP no es un agregado ni una clase de dominio: es el **nombre del workflow** reflejado en eventos `workflow.flow.*` y en el parámetro `flowId` (identificador del Domain Event que registra cada transición).

**Pregunta abierta (P2):** si Flow evoluciona a agregado propio, requiere Field Story que lo justifique.

---

### Event (Domain Event)

Hecho irreversible ocurrido en el dominio. Inmutable. Append-only en el Event Log. Toda transición relevante de Incident y Shift produce exactamente un Domain Event por transición.

**No confundir con:** evento de infraestructura, mensaje de Outbox (aunque la Outbox transporta el evento).

---

### Event Log

Fuente de verdad del sistema (ADR-002). Tabla `events`. Las proyecciones son vistas derivadas; nunca la verdad primaria.

**Regla:** prohibido modificar proyección sin un evento que lo justifique.

---

### Projection (proyección)

Vista optimizada para lectura. Tabla `incidents` con `current_projection_state` (jsonb). Se actualiza en la misma transacción que el Domain Event y la Outbox.

**Deuda conocida (P1):** algunos campos de proyección (`assetId`, `shiftId`, `actorId`) no están en el payload del evento `workflow.flow.detected`; el replay no los reconstruye.

---

### Outbox

Tabla `outbox`. Registro pendiente de publicación de un Domain Event. Patrón Transactional Outbox. Escribe en la misma transacción que el Event Log y la proyección.

---

### Policy

Regla de negocio del edificio. Concepto de dominio futuro; no es un agregado implementado en el MVP.

**No usar:** Config, Setting, Rule como sustituto en código de dominio.

---

### Timeline

Vista de lectura (read model) que ordena cronológicamente los hechos operativos de un Incident. **No es un agregado.**

**No usar:** ActivityFeed, AuditLog, History como nombre de dominio.

**Fuentes MVP:** `events`, `event_evidences`, `work_orders`, `notifications`. Sin replay, sin `current_projection_state`, sin reconstrucción de agregados.

**Entrada (`TimelineEntryView`):** `timestamp`, `type`, `description`, `actorId | null`. Sin campos adicionales.

**Tipos de entrada típicos:**

| Origen | `type` ejemplo |
|--------|----------------|
| Event Log | `workflow.flow.detected`, `.assigned`, etc. |
| Evidencia asociada | `EVIDENCE_ASSOCIATED` |
| WorkOrder | `WORK_ORDER_CREATED` |
| WorkOrder | `WORK_ORDER_CREATED` |
| Notification (repositorio) | `INCIDENT_DETECTED`, `INCIDENT_ASSIGNED`, etc. |
| Notification (use case Sprint 12) | `NOTIFICATION` |

Sprint 12: `GetIncidentTimelineUseCase` enriquece el timeline con `NotificationQueryRepository.findRecent(100)`, filtrando solo tipos `INCIDENT_*` y mapeándolos a entradas `NOTIFICATION`.

**HTTP:** `GET /api/v1/operations/incidents/:incidentId/timeline` → array plano de entradas.

**Deuda conocida (P2):** enriquecimiento usa `findRecent(100)` sin filtro por `incidentId`; correlación heurística en repositorio persiste para otras fuentes.

---

### Space

Espacio físico del edificio (piso, unidad, área común). Término del lenguaje ubicuo; agregado no implementado en el MVP.

---

### Work

Concepto de negocio genérico. **No es una clase del dominio.** El trabajo concreto se modela como Incident, WorkOrder, inspección futura, custodia futura, etc.

---

## Cadena operativa actual (MVP)

Flujo de detección de Incident:

```
Site
  └── Asset (siteId)
        └── Shift activo del Site
              └── Actor del Shift (actorId)
                    └── Incident.detect()
```

Registro previo típico:

```
POST Site → POST Asset → POST Actor → POST Shift/start → POST Incident (detect)
```

Generación de WorkOrder desde Incident:

```
Incident (existente)
  └── CreateWorkOrderFromIncidentUseCase
        └── resuelve actorId (assignedActorId ?? actorId)
              └── CreateWorkOrderUseCase
```

Notificaciones automáticas (ciclo operativo completo):

```
DetectIncidentUseCase
  └── persistencia Incident
        └── CreateNotificationUseCase → INCIDENT_DETECTED

AssignIncidentUseCase
  └── persistencia Incident
        └── CreateNotificationUseCase → INCIDENT_ASSIGNED

StartWorkOrderUseCase
  └── persistencia WorkOrder
        └── CreateNotificationUseCase → WORK_ORDER_STARTED

CompleteWorkOrderUseCase
  └── persistencia WorkOrder
        └── CreateNotificationUseCase → WORK_ORDER_COMPLETED

ResolveIncidentUseCase
  └── persistencia Incident
        └── CreateNotificationUseCase → INCIDENT_RESOLVED
```

Todas las integraciones viven en Application. Nunca en dominio.

Timeline operacional de un Incident:

```
GET /api/v1/operations/incidents/:incidentId/timeline
  └── GetIncidentTimelineUseCase
        ├── IncidentTimelineRepository
        │     ├── events
        │     ├── event_evidences
        │     ├── work_orders
        │     └── notifications (correlación SQL)
        └── NotificationQueryRepository.findRecent(100)
              └── entradas NOTIFICATION (INCIDENT_*)
```

Notification Read Model (Sprint 12):

```
GET /api/v1/operations/notifications/:id
GET /api/v1/operations/actors/:actorId/notifications
  └── GetNotificationByIdUseCase / ListNotificationsUseCase
        └── NotificationQueryRepository

GET /api/v1/operations/dashboard?actorId=…
  └── GetOperationsDashboardUseCase
        └── NotificationQueryRepository.findByRecipient()
        └── summary + activityFeed (Sprint 13)
```

Health e Info (Sprint 13):

```
GET /api/v1/health
  └── GetHealthUseCase
        └── PostgresOperationsPool.query('SELECT 1')

GET /api/v1/info
  └── GetApiInfoUseCase
        └── metadatos constantes (sin DB)
```

Observability (Sprint 14):

```
HTTP Request
  └── CorrelationIdMiddleware
        └── CorrelationIdProvider (ALS)
              ├── ApplicationLogger → { timestamp, level, correlationId, message }
              ├── ApplicationMetrics → incident.*.{success|failure}
              └── Incident Use Cases
                    ├── events.correlation_id
                    └── outbox.correlation_id
```

API Platform (Sprint 15):

```
HTTP Request
  └── HttpValidationPipe (global, solo @Body)
        └── Request Pipes (específicos)
              └── Controller → Use Case
                    ↓ (error)
              ProblemDetailsFilter → application/problem+json

GET /api/docs        → Swagger UI (OpenAPI)
GET /api/docs-json   → especificación OpenAPI
GET /api/v1/info     → ApplicationConfig (name, version, environment)
```

Authentication (Sprint 16–17):

```
POST /api/v1/authentication/users          (público)
  └── CreateUserUseCase → UserPersistence → users

GET /api/v1/authentication/users/:id       (público)
  └── GetAuthenticatedUserUseCase → UserQueryRepository → users

GET /api/v1/authentication/me              (protegido — Bearer JWT)
  └── JwtAuthenticationGuard
        └── JWTAuthenticationContext (valida JWT → userId)
              └── GetCurrentUserUseCase
                    └── GetAuthenticatedUserUseCase → users
```

Frontend (Sprint 18 — Release Candidate):

```
Browser :5173 (Vite)
  └── proxy /api → Backend :3000
        ├── Home → GET /api/v1/info
        ├── Login → JWT en localStorage (manual)
        ├── Dashboard → GET /api/v1/operations/dashboard
        └── Incident Details → GET incidents/:id + timeline
```

---

## Frontend — capa de presentación

Términos del cliente web en `frontend/`. **No son conceptos de dominio**; viven solo en la capa de presentación. El backend no los conoce.

### Frontend

Cliente web React que consume la API REST de EdificiOS. Capa de presentación pura: sin lógica de negocio, sin endpoints propios, sin modificar contratos HTTP.

**Stack MVP:** Vite, React 19, TypeScript, React Router, TanStack Query, Tailwind CSS v4, Axios.

**Versión RC:** `0.18.0-alpha`.

---

### ProtectedRoute (Protected Route)

Componente de ruta que exige autenticación en el cliente (JWT presente en `localStorage`).

**También conocido como:** Protected Route.

**Comportamiento:** si `isAuthenticated === false` → redirige a `/login` preservando la ruta de destino en `location.state`.

**Aplicado en Sprint 18:** `/dashboard` únicamente. Operations permanece público en backend.

**No confundir con:** `JwtAuthenticationGuard` (backend HTTP).

---

### AuthContext

Contexto React que gestiona el token JWT en el cliente.

**API:** `token`, `isAuthenticated`, `setToken()`, `logout()`.

**Persistencia:** `localStorage` vía `authToken.ts`.

**No hace:** validar JWT criptográficamente (eso es `JWTAuthenticationContext` en backend al llamar `/me`).

---

### Activity Feed (UI)

Representación visual de la lista `activityFeed` del Dashboard en el frontend.

**Componentes:** `ActivityFeedList`, `ActivityFeedItem`.

**Navegación:** clic en entrada `INCIDENT` correlacionada → `/incidents/:incidentId` vía `resolveIncidentIdForFeedEntry.ts`.

**No confundir con:** `ActivityFeedEntry` del backend (DTO en `DashboardView`). La UI no redefine el contrato; solo lo renderiza.

---

### Skeleton (Skeleton Loader)

Placeholder animado que simula la estructura del contenido mientras carga una query de TanStack Query.

**También conocido como:** Skeleton Loader.

**Variantes reutilizables (Sprint 18 PR4):**

| Componente | Uso |
|------------|-----|
| `Skeleton` | Bloque base |
| `SkeletonCard` | Cards con líneas de texto |
| `SkeletonList` | Listas de ítems |
| `SkeletonTimeline` | Timeline vertical |
| `DashboardMetricsSkeleton` | Grid de métricas del dashboard |

**No confundir con:** spinner genérico (`Loader` eliminado en PR4).

---

### EmptyState

Componente reutilizable para secciones sin datos.

**Props:** `icon` (`EmptyStateIconName`), `title`, `description`.

**Usado en:** Activity Feed, Notifications, Timeline.

---

### ErrorCard

Componente reutilizable para errores de carga o API.

**Props:** `title`, `description`, `onRetry?`.

**Regla:** nunca muestra JSON crudo ni stack traces. Los mensajes provienen de `parseApiError`.

---

### Problem Details UI

Capa de presentación que traduce respuestas RFC 9457 del backend a mensajes legibles para el usuario.

**Módulo:** `frontend/src/utils/parseApiError.ts`, `frontend/src/types/problemDetails.ts`.

**Comportamiento:**

- Si `application/problem+json` → `title` + `detail` del Problem Details
- Si error de red → mensaje de conectividad
- Fallback → mensaje genérico

**No confundir con:** `ProblemDetailsFilter` (backend). La UI solo consume el contrato ya existente.

---

### Toast

Notificación efímera en pantalla para feedback de operaciones del usuario.

**Infraestructura:** `toastStore` (estado global) + `ToastContainer` (render en `AppProviders`).

**Tipos:** `success`, `error`, `info`.

**Casos MVP:** login exitoso, logout, errores de red (interceptor Axios), reintentos desde `ErrorCard`.

**No confundir con:** Notification (dominio Operations). Toast es feedback transitorio de UI, no se persiste.

---

### TanStack Query (React Query)

Librería de fetching, cache y sincronización de datos del servidor para React.

**También conocido como:** React Query (nombre histórico del proyecto).

**En EdificiOS:** gestiona `isLoading`, `isError`, `refetch` en `useDashboard`, `useIncident`, `useIncidentTimeline` y la query de `HomePage`.

**No reemplaza:** lógica de negocio ni casos de uso del backend; solo orquesta llamadas HTTP y estados de UI.

---

### Application Shell

Envoltorio estructural de la aplicación web: proveedores globales, layout y enrutamiento.

**Componentes:**

| Pieza | Rol |
|-------|-----|
| `AppProviders` | `QueryClientProvider` + `AuthProvider` + `ToastContainer` |
| `App.tsx` | `BrowserRouter` + `AppRoutes` |
| `AppLayout` | Sidebar + Header + área de contenido |
| `AuthLayout` | Layout centrado para Login |

**Usado en:** todas las pantallas del Release Candidate.

---

### Frontend Layout

Patrón de composición visual que define la estructura de cada pantalla sin lógica de negocio.

**Layouts MVP:**

| Layout | Pantallas |
|--------|-----------|
| `AppLayout` | Home, Dashboard, Incident Viewer |
| `AuthLayout` | Login |

**Incluye:** `Sidebar` (navegación), `Header` (título + logout), `Container`, `Section`, `Card`.

**Responsive:** sidebar colapsable en móvil; grid adaptativo en Dashboard.

---

### AppLayout

Layout principal con `Sidebar` + `Header` + área de contenido. Responsive: sidebar colapsable en móvil.

**Usado en:** Home, Dashboard, Incident Details.

---

## Términos prohibidos en código y dominio

| Prohibido | Usar en su lugar |
|-----------|------------------|
| Ticket | Incident |
| Task | Incident / Work (concepto) |
| Issue | Incident |
| Attachment | Evidence |
| Setting | Policy |
| Config | Policy |
| Guardia | Actor / Shift (según contexto) |
| Operator | Actor |
| User | Actor (hasta que exista autenticación) |

---

## Límites entre agregados

| Relación | Tipo | Dónde se valida |
|----------|------|-----------------|
| Asset → Site | Referencia por `SiteId` | `RegisterAssetUseCase` |
| Shift → Site | Referencia por `SiteId` | Application (parcial; P1) |
| Shift → Actor | Referencia por `ActorId` | `StartShiftUseCase` |
| Actor → Site | Referencia en persistencia | `RegisterActorUseCase` |
| Incident → Asset | Referencia por `AssetId` | `DetectIncidentUseCase` |
| Incident → Shift | Referencia por `ShiftId` | `DetectIncidentUseCase` |
| Incident → Actor (detección) | Derivado del Shift activo | `DetectIncidentUseCase` |
| Incident → WorkOrder | Referencia por `incidentId` | `CreateWorkOrderFromIncidentUseCase` → `CreateWorkOrderUseCase` |
| Incident → Notification | Sin referencia en agregados | `DetectIncidentUseCase`, `AssignIncidentUseCase`, `ResolveIncidentUseCase` → `CreateNotificationUseCase` |
| WorkOrder → Notification | Sin referencia en agregados | `StartWorkOrderUseCase`, `CompleteWorkOrderUseCase` → `CreateNotificationUseCase` |
| Evidence → Event | Asociación post-captura | `CaptureEvidenceUseCase` / PR3 |

**Regla:** sin Foreign Keys entre agregados. Integridad en Application.

---

## Referencias

- Constitución de ingeniería: `AGENTS.md`
- Reglas de modelado: `docs/06_rules.md`
- Decisiones arquitectónicas: `docs/architecture_decisions/`
- Deuda priorizada: `docs/architecture_backlog.md`
- Estado del proyecto: `docs/05_current_status.md`
- Guía de uso local: `docs/GUIA_USO.md`
