# Architecture Review 09 — Testing Architecture

**Versión:** post `0.18.0-alpha`  
**Fecha:** 2026-07-15  
**Alcance:** `test/`, `frontend/src/**/*.test.tsx`  
**Restricción:** sin reducir cobertura; sin eliminar tests útiles.

---

## Objetivo

Auditar duplicación de helpers, builders, fixtures, mocks, harness y setup entre tests backend (unit, integration, http) y frontend (Vitest).

---

## Análisis

| Capa | Suites | Patrón dominante |
|------|--------|------------------|
| Backend unit (`*.spec.ts`) | ~25 | Mocks inline, fixtures locales |
| Backend integration | ~30 | Repos con `jest.fn()` pool |
| Backend HTTP (`*.http.integration.spec.ts`) | ~25 | Nest TestingModule + Fastify inject |
| Frontend Vitest | 2 | `vi.mock` auth.api + fixtures locales |

Infraestructura existente pre-review: `test/support/operations-http-test-auth.ts` (11 consumidores HTTP Operations).

---

## Hallazgos

### 1. Bootstrap Fastify repetido (corregido parcialmente)

~20 archivos HTTP repetían:

```typescript
app = moduleRef.createNestApplication(new FastifyAdapter());
await app.init();
await app.getHttpAdapter().getInstance().ready();
```

**Corrección:** `test/support/create-fastify-test-app.ts` — adoptado en **20 suites** (health, problem-details, http-validation + 17 vía migración batch).

**Pendiente documentado:** `capture-evidence`, `login`, `swagger`, `jwt-authentication-*` usan variantes con hooks/Swagger entre creación e init — no migrados.

### 2. `UUID_V4_PATTERN` duplicado (corregido)

`problem-details.http.integration.spec.ts` y `http-validation.integration.spec.ts` definían el mismo regex.

**Corrección:** `test/support/uuid-patterns.ts`.

### 3. Fixtures auth frontend duplicados (corregido)

`AuthContext.test.tsx` y `LoginPage.test.tsx` repetían `authenticatedUser` y builder de `AxiosError` 401.

**Corrección:** `frontend/src/test/fixtures/auth.ts`.

### 4. `operationsHttpTestAuthProviders` (ya consolidado)

11 tests HTTP Operations importan el helper de AR previo — sin cambio; patrón correcto.

### 5. UUIDs de prueba repetidos en integration (documentado)

Patrón `00000000-0000-0000-0000-0000000000XX` repetido en ~30 specs. Extraer `test/support/test-ids.ts` con constantes nombradas sería mejora futura; cada test usa IDs con semántica local — no duplicación byte-a-byte.

### 6. Dashboard fixture extenso (documentado)

`dashboard.http.integration.spec.ts` define `DashboardView` completo inline — específico del contrato HTTP; no candidato a builder genérico sin sobre-abstracción.

### 7. Consistencia integration vs HTTP (documentado)

- **Unit/domain:** agregados y VOs sin Nest.
- **Integration application:** use cases con mocks de puertos.
- **HTTP:** controllers + inject + Problem Details.

Tres niveles coherentes; no unificar en un mega-harness.

### 8. Frontend test setup (sin hallazgo)

`frontend/src/test/setup.ts` — Vitest global; 2 suites, cobertura login/auth suficiente para RC.

---

## Cambios realizados

| Archivo | Cambio |
|---------|--------|
| `test/support/create-fastify-test-app.ts` | **Creado** |
| `test/support/uuid-patterns.ts` | **Creado** |
| `frontend/src/test/fixtures/auth.ts` | **Creado** |
| 20 suites HTTP + 2 frontend tests | Adoptan helpers |

---

## Decisiones

- No extraer builder genérico de `DashboardView` — fixture es documentación del contrato.
- No migrar tests con bootstrap no estándar — riesgo > beneficio.
- Mantener fixtures UUID locales en integration — legibilidad por escenario.

---

## Deuda remanente

- 4 suites HTTP con bootstrap custom (`capture-evidence`, `login`, `swagger`, `jwt-*`).
- Catálogo centralizado de test UUIDs (P2).
- Tests E2E frontend (Playwright) — backlog Sprint 18.
- Sin shared helper para mock `Pool` — patrón repetido pero simple.

---

## Conclusión

Infraestructura de testing consolidada en harness Fastify, regex UUID y fixtures auth frontend. `operationsHttpTestAuthProviders` valida el patrón de support por dominio. Cobertura intacta: 658 backend + 8 frontend tests.
