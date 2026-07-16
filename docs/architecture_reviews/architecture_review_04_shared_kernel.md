# Architecture Review 04 — Shared Kernel

**Versión:** post `0.18.0-alpha`  
**Fecha:** 2026-07-15  
**Alcance:** `src/shared`  
**Restricción:** sin mover código entre bounded contexts; sin cambio de comportamiento.

---

## Objetivo

Auditar el shared kernel en busca de utilidades duplicadas, constantes repetidas, tipos repetidos, helpers similares, código muerto y módulos innecesarios.

---

## Análisis

Inventario de `src/shared` (15 archivos):

| Área | Archivos | Consumidores |
|------|----------|--------------|
| Correlation ID | `correlation-id.ts`, `http/correlation-id.middleware.ts` | AppModule, Operations, tests HTTP |
| HTTP validation | `http-validation.ts`, `http-validation.pipe.ts` | AppModule (APP_PIPE global) |
| Problem Details | `problem-details.ts`, `problem-details.filter.ts` | AppModule (APP_FILTER global) |
| Swagger | `swagger/*` (4 archivos) | `main.ts`, tests |
| Logging | `logging/logger.ts`, `logging/application-logger.ts` | SharedModule, Operations, Outbox |
| Metrics | `metrics/metrics-view.ts`, `metrics/application-metrics.ts` | SharedModule, use cases Incident |
| DI | `shared.module.ts` | AppModule (global) |

No se detectó código muerto: todos los archivos tienen consumidores activos.

---

## Hallazgos

### 1. Imports de DTOs Swagger duplicados (corregido)

`setup-swagger.ts` y `openapi-enrichment.ts` importaban independientemente los mismos 11 DTOs de Authentication y Operations. Cualquier endpoint nuevo requería tocar dos archivos.

### 2. Configuración PostgreSQL duplicada (corregido)

`PostgresOperationsPool` y `PostgresAuthenticationPool` repetían idénticamente:

```typescript
new Pool({ connectionString: process.env.DATABASE_URL })
```

Se extrajo a `shared/persistence/postgres-pool-factory.ts`. Los tokens DI (`PostgresOperationsPool`, `PostgresAuthenticationPool`) se mantienen separados por bounded context — sin fusionar instancias.

### 3. Sin duplicación — HTTP validation vs request parsing

`http-validation.ts` valida body JSON global (`isJsonObjectPayload` excluye arrays). Los pipes de request usan `isHttpPayloadObject` (acepta arrays como objeto). **No unificados** — reglas distintas.

### 4. Sin código muerto

- `logger.ts` — tipos usados por `ApplicationLogger` y tests.
- `metrics-view.ts` — constantes de métricas usadas por use cases Incident.
- `shared.module.ts` — necesario; exporta providers globales.

### 5. Acoplamiento Swagger → DTOs multi-BC (documentado)

`swagger-request-dtos.ts` centraliza imports pero sigue referenciando DTOs de Authentication y Operations. Es documentación OpenAPI transversal; no se movió código entre BCs.

---

## Cambios realizados

| Archivo | Cambio |
|---------|--------|
| `shared/http/swagger/swagger-request-dtos.ts` | **Creado** — catálogo único de DTOs y `SWAGGER_EXTRA_MODELS` |
| `shared/http/swagger/setup-swagger.ts` | Usa `SWAGGER_EXTRA_MODELS`; eliminados 11 imports duplicados |
| `shared/http/swagger/openapi-enrichment.ts` | Importa DTOs desde `swagger-request-dtos.ts` |
| `shared/persistence/postgres-pool-factory.ts` | **Creado** — `resolvePostgresPoolConfig()`, `createPostgresPool()` |
| `operations/.../postgres-operations-pool.ts` | Delega a factory |
| `authentication/.../postgres-authentication-pool.ts` | Delega a factory |

---

## Decisiones

- **No fusionar pools en un único provider:** Operations y Authentication conservan tokens propios; solo se comparte la factory de configuración.
- **No extraer `readOptionalString` a shared:** variantes con firmas distintas en `register-asset` y `list-incidents-query` — unificar arriesgaría mensajes HTTP.

---

## Trade-offs

| Decisión | Beneficio | Coste |
|----------|-----------|-------|
| `swagger-request-dtos.ts` | Un solo punto para DTOs OpenAPI | Sigue acoplado a infra HTTP de otros BCs (aceptado) |
| Factory de pool | DRY en configuración | Dos instancias Pool siguen existiendo |

---

## Deuda remanente

- Swagger shared importa DTOs de Authentication y Operations (P2, AR03).
- `UUID_PATTERN` repetido en pipes y dominio — fuera de alcance shared (dominio no tocado).
- `readOptionalString` duplicado entre pipes — candidato AR05 futuro con API unificada.

---

## Conclusión

Shared kernel limpio: sin código muerto ni módulos innecesarios. Se corrigieron dos duplicaciones reales (Swagger DTOs, pool config). El resto del kernel está bien acotado y en uso.
