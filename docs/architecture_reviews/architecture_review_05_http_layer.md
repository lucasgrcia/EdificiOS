# Architecture Review 05 — HTTP Layer

**Versión:** post `0.18.0-alpha`  
**Fecha:** 2026-07-15  
**Alcance:** controllers, pipes, filters, middlewares, Swagger, Problem Details, validation  
**Restricción:** sin cambiar respuestas HTTP ni contratos REST.

---

## Objetivo

Auditar la infraestructura HTTP en busca de validaciones repetidas, pipes equivalentes, helpers duplicados, imports innecesarios, wiring repetido y simplificaciones posibles.

---

## Análisis

| Componente | Cantidad | Estado |
|------------|----------|--------|
| Controllers Operations | 12 | Todos con `@UseGuards(JwtAuthenticationGuard)` — repetición intencional RC |
| Controllers Authentication | 2 | Login público; `/me` con guard |
| Controllers System | 2 | Health, Info — públicos |
| Request pipes | 18 | 8 con `readRequiredString` duplicado |
| Path param pipes | 6 | Lógica idéntica, mensajes distintos |
| Global filter | 1 | `ProblemDetailsFilter` — RFC 9457 |
| Global pipe | 1 | `HttpValidationPipe` — Content-Type JSON |
| Middlewares | 2 | CorrelationId (shared), AuthenticationContext (authentication) |

---

## Hallazgos

### 1. Path param pipes equivalentes (corregido)

Seis pipes validaban `trim()` + no vacío con la misma lógica:

- `GetIncidentByIdParamsPipe`
- `GetNotificationByIdParamsPipe`
- `GetWorkOrderByIdParamsPipe`
- `ListNotificationsByActorParamsPipe`
- `ListWorkOrdersByIncidentParamsPipe`
- `ListEvidenceByEventParamsPipe`

**Corrección:** helper `validateRequiredPathParam()` en `shared/http/validate-required-path-param.ts`. Mensajes de error preservados literalmente.

### 2. Request body parsing duplicado (corregido parcialmente)

Ocho pipes repetían `isObject()` + `readRequiredString()`:

- `register-site`, `register-actor`, `register-asset`
- `detect-incident`, `start-shift`
- `create-work-order`, `create-work-order-from-incident`
- `create-notification`

**Corrección:** `isHttpPayloadObject()` y `readRequiredString()` en `shared/http/http-request-parsing.ts`.

**No migrados** (lógica específica):

- `assign-incident-request.pipe` — validación inline de `actorId`
- `create-user-request.pipe` — email normalizado a lowercase
- `login-request.pipe` — validación de credenciales
- `list-incidents-query.pipe` — query params opcionales con `readOptionalString` distinto
- `get-authenticated-user-params.pipe` — validación UUID
- `capture-evidence-multipart.pipe` — multipart, no JSON

### 3. JwtAuthenticationGuard repetido en 12 controladores (documentado)

Cada controller Operations importa y aplica el guard. Alternativas (`@Controller` a nivel módulo, `APP_GUARD` condicional) cambiarían wiring o comportamiento de rutas públicas. **No corregido.**

### 4. Problem Details y validation global (sin hallazgo)

- `ProblemDetailsFilter` — mapeo único y centralizado.
- `HttpValidationPipe` — APP_PIPE global; sin duplicación en controllers.

### 5. Swagger enrichment manual (documentado)

`openapi-enrichment.ts` mantiene catálogo `ENDPOINTS` manual (~40 entradas). Duplicación con decoradores Nest no existe (controllers sin `@ApiTags`). Mantener catálogo explícito es decisión de Sprint 15; fuera de alcance.

---

## Cambios realizados

| Archivo | Cambio |
|---------|--------|
| `shared/http/validate-required-path-param.ts` | **Creado** |
| `shared/http/http-request-parsing.ts` | **Creado** |
| 6 path param pipes | Usan `validateRequiredPathParam` |
| 8 request pipes | Usan `isHttpPayloadObject` + `readRequiredString` |

---

## Decisiones

- Mensajes `BadRequestException` inmutables — mismos strings que antes.
- `isHttpPayloadObject` ≠ `isJsonObjectPayload` — no unificar (arrays).
- Guards por controller — explícitos y trazables; no APP_GUARD global.

---

## Trade-offs

| Decisión | Beneficio | Coste |
|----------|-----------|-------|
| Helpers en shared | DRY sin tocar dominio | Pipes siguen siendo clases Nest registradas individualmente |
| 12 guards explícitos | Claridad por endpoint | Verbosidad en controllers |

---

## Deuda remanente

- JWT guard repetido en 12 controllers (P2 — ADR guard transversal).
- `readOptionalString` duplicado en `register-asset` y `list-incidents-query`.
- `UUID_PATTERN` en 3 pipes HTTP + dominio — candidato shared kernel futuro.
- Catálogo OpenAPI manual en `openapi-enrichment.ts`.

---

## Conclusión

Se eliminaron 14 implementaciones duplicadas de validación HTTP (6 path + 8 body) sin alterar contratos ni respuestas. La capa HTTP global (Problem Details, JSON validation, Correlation ID) está bien centralizada. El wiring JWT repetido queda documentado como deuda consciente del RC.
