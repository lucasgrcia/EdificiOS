# Architecture Review — Sprint 15: API Platform

**Objetivo:** consolidar la plataforma HTTP transversal (errores, validación, documentación, configuración) sin modificar dominio, agregados ni casos de uso de negocio.  
**Alcance revisado:** PR1–PR5 (Problem Details, HTTP Validation, Swagger/OpenAPI, ApplicationConfig, documentación).

---

## Veredicto

**Sprint 15 es aprobable sin correcciones P0.**

La API gana un contrato de errores predecible (RFC 9457), validación HTTP global que convive con pipes existentes, documentación OpenAPI viva y configuración centralizada. Todo vive en `src/shared/http/` y `src/config/` como infraestructura transversal.

La deuda identificada es P2: autenticación, autorización, rate limiting, versionado v2, SDKs OpenAPI y configuración por variables de entorno.

---

## Objetivo

1. **Problem Details** — respuesta de error unificada según RFC 9457
2. **HTTP Validation** — validación global de body JSON sin eliminar Request Pipes
3. **Swagger / OpenAPI** — documentación automática de toda la API
4. **ApplicationConfig** — punto único para name, version, environment, apiPrefix, swaggerPath

Sin modificar dominio, Application de Operations, Event Log, Dashboard, Notifications ni Timeline.

---

## Arquitectura

### Estructura API Platform

```
src/shared/http/
├── problem-details.ts
├── problem-details.filter.ts      ← APP_FILTER global
├── http-validation.ts
├── http-validation.pipe.ts        ← APP_PIPE global
└── swagger/
    ├── problem-details.schema.ts
    ├── swagger.constants.ts
    ├── openapi-enrichment.ts
    └── setup-swagger.ts

src/config/
├── application-config.ts
└── application-config.module.ts   ← @Global()
```

`AppModule` registra `ProblemDetailsFilter` y `HttpValidationPipe` globalmente. `ApplicationConfigModule` exporta `ApplicationConfig` como singleton global.

### Flujo HTTP completo

```
HTTP Request
    ↓
CorrelationIdMiddleware (Sprint 14)
    ↓
HttpValidationPipe (solo @Body)
    ↓
Request Pipes específicos (DetectIncidentRequestPipe, etc.)
    ↓
Controller
    ↓
Use Case
    ↓ (excepción)
ProblemDetailsFilter → application/problem+json
```

Documentación y configuración son **paralelas** al flujo de negocio:

```
ApplicationConfig → GET /api/v1/info, metadata Swagger
setupSwagger      → GET /api/docs, GET /api/docs-json
```

---

## Validation

| Componente | Rol |
|------------|-----|
| `HttpValidationPipe` | Pipe global request-scoped; solo `metadata.type === 'body'` |
| `validateHttpJsonBody` | Content-Type JSON, rechazo `null`, payload debe ser objeto |
| Request Pipes existentes | Validación semántica por DTO; se ejecutan **después** |

**Reglas MVP:**

- GET sin `@Body()` → sin validación global
- Multipart (`CaptureEvidenceMultipartPipe` con `@Req()`) → no pasa por validación JSON
- Errores de validación → `BadRequestException` → Problem Details

**Trade-off:** la validación global no sustituye pipes de ruta; duplica la comprobación “es objeto” en algunos casos, pero mantiene separación HTTP vs semántica de negocio.

---

## Problem Details

| Componente | Rol |
|------------|-----|
| `ProblemDetails` | Tipo: `type`, `title`, `status`, `detail`, `instance`, `correlationId` |
| `ProblemDetailsFilter` | `@Catch()` global; mapea excepciones HTTP conocidas |
| URLs `type` | `https://api.edificios/errors/{not-found\|bad-request\|...}` |

**Integración Sprint 14:** `correlationId` desde `CorrelationIdProvider.get()`; `instance` = `request.url`.

**Excepciones mapeadas:** `NotFoundException` (404), `BadRequestException` (400), `ConflictException` (409), `ForbiddenException` (403), `InternalServerErrorException` (500). Cualquier otro error → 500.

---

## Swagger

| Componente | Rol |
|------------|-----|
| `setupSwagger` | `DocumentBuilder` + `SwaggerModule.setup` |
| `openapi-enrichment.ts` | Tags, request bodies, query params, responses Problem Details |
| DTOs HTTP | `@ApiProperty` en clases existentes de infrastructure |

**Endpoints documentados:** Operations (Assets, Sites, Actors, Shifts, Incidents, WorkOrders, Notifications, Dashboard, Timeline, Events), Health, Info.

**URLs:**

| Recurso | Path |
|---------|------|
| Swagger UI | `GET /api/docs` |
| OpenAPI JSON | `GET /api/docs-json` |

**Security:** esquema Bearer JWT declarado; `security: []` en operaciones (sin auth en MVP).

---

## Configuration

| Propiedad | Valor MVP | Consumidor |
|-----------|-----------|------------|
| `name` | `EdificiOS API` | Info, Swagger title |
| `version` | `0.15.0-alpha` | Info, Swagger version |
| `environment` | `development` | Info |
| `apiPrefix` | `/api/v1` | Referencia; rutas de controllers sin cambio |
| `swaggerPath` | `/api/docs` | Swagger UI + JSON |

**Independencia:** `ApplicationConfigModule` no importa Operations. `@Global()` permite inyección desde cualquier módulo.

**Nota:** `GetHealthUseCase` conserva versión propia (`0.13.0-alpha`); no modificado en Sprint 15 por restricción de alcance.

---

## Beneficios

| Beneficio | Detalle |
|-----------|---------|
| Contrato de errores predecible | Clientes siempre reciben RFC 9457 con `correlationId` |
| Validación en capas | HTTP global + semántica en pipes; sin romper arquitectura existente |
| Documentación viva | OpenAPI generado desde rutas reales; DTOs y errores documentados |
| Configuración única | Un cambio de versión/nombre propaga a Info y Swagger |
| Cero impacto en dominio | Toda la plataforma vive en shared/config |

---

## Trade-offs

| Trade-off | Decisión | Alternativa descartada |
|-----------|----------|------------------------|
| Enriquecimiento OpenAPI manual | `openapi-enrichment.ts` sin decoradores en controllers | Decoradores en cada método (más invasivo) |
| Health fuera de ApplicationConfig | Restricción de alcance Sprint 15 | Unificar versión Health/Info (requiere tocar Health) |
| Validación solo en `@Body()` | Pipes NestJS actúan por parámetro | Middleware de body (menos idiomático en Nest) |
| Config hardcodeada | Valores en clase TypeScript | `ConfigModule` + `.env` (deuda futura) |
| Bearer sin implementación | Preparar contrato OpenAPI | Implementar JWT en MVP (fuera de alcance) |

---

## Deuda futura

Ítems P2 documentados en `docs/architecture_backlog.md` (sección Sprint 15):

- Autenticación y autorización
- Rate limiting
- Versionado múltiple (v2)
- Generación automática de SDKs desde OpenAPI
- Configuración desde variables de entorno (`NODE_ENV`, `package.json`, unificar Health)

---

## Conclusión

Sprint 15 completa la **API Platform** de EdificiOS: la capa HTTP deja de ser un conjunto de adaptadores aislados y pasa a tener contrato de errores, validación de entrada, documentación y configuración coherentes.

El bounded context `operations` y sus ocho agregados permanecen intactos. La plataforma es reutilizable, testeable (574 tests, 56 suites) y lista para evolucionar hacia auth, env config y clientes generados sin refactor estructural.

**Versión:** `0.15.0-alpha`  
**Tests:** 574/574 OK · 56 test suites · Build OK
