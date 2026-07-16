# Architecture Review 08 — Frontend Architecture

**Versión:** post `0.18.0-alpha`  
**Fecha:** 2026-07-15  
**Alcance:** `frontend/src`  
**Restricción:** sin cambio visual, rutas, llamadas HTTP ni UX.

---

## Objetivo

Auditar hooks, componentes, utilidades, tipos, páginas y auth en busca de duplicación, código muerto y oportunidades de consolidación arquitectónica.

---

## Análisis

| Área | Archivos | Estado |
|------|----------|--------|
| `api/` | 5 | Cliente Axios dual; Operations usa `publicApiClient` |
| `hooks/` | 4 | 3 React Query + 1 re-export `useAuth` |
| `components/` | 24 | Base UI + dominio dashboard/incident |
| `pages/` | 4 | Patrón loading/error/data repetido |
| `auth/` | 3 | Context + token + ProtectedRoute |
| `utils/` | 2 → 4 | Tras review |
| `types/` | 5 | Sin duplicación cross-file |

---

## Hallazgos

### 1. Formateo de fechas duplicado (corregido)

`ActivityFeedItem`, `NotificationItem` y `TimelineDate` repetían `Intl.DateTimeFormat('es-AR', …)` con variantes `short`/`medium`.

**Corrección:** `utils/formatDateTime.ts`.

### 2. Condición `enabled` duplicada en hooks (corregido)

`useIncident` y `useIncidentTimeline` repetían `incidentId !== undefined && incidentId.trim() !== ''`.

**Corrección:** `utils/isNonEmptyString.ts`.

### 3. Interceptor de red duplicado en `client.ts` (corregido)

Mismo `interceptors.response.use` en `publicApiClient` y `authenticatedApiClient`.

**Corrección:** `attachNetworkErrorInterceptor()`.

### 4. Assets sin referencias (corregido)

`hero.png`, `react.svg`, `vite.svg` — sin imports en el código.

**Corrección:** eliminados.

### 5. Operations API con `publicApiClient` (documentado)

`dashboard.api.ts` e `incident.api.ts` usan `publicApiClient` pese a JWT en backend RC. Cambiar a `authenticatedApiClient` alteraría headers HTTP → fuera de alcance.

### 6. Patrón página loading/error/retry (documentado)

`HomePage`, `DashboardPage`, `IncidentDetailsPage` repiten `ErrorCard` + `parseApiError` + `handleRetry`. Extraer hook `useQueryPageState` sería refactor mayor; diferencias en queries múltiples (Incident) justifican mantener inline.

### 7. `useAuth` como re-export (aceptado)

`hooks/useAuth.ts` re-exporta `useAuthContext` — convención de API pública del cliente, no duplicación.

### 8. Sin componentes duplicados

`Card`, `Section`, `ErrorCard`, skeletons — únicos y reutilizados. Dashboard e Incident tienen dominios distintos.

### 9. Tipos sin duplicación

`ProblemDetails` en frontend es contrato HTTP del cliente; no duplica backend (bounded contexts separados).

---

## Cambios realizados

| Archivo | Cambio |
|---------|--------|
| `utils/formatDateTime.ts` | **Creado** |
| `utils/isNonEmptyString.ts` | **Creado** |
| `api/client.ts` | Interceptor unificado |
| `hooks/useIncident.ts`, `useIncidentTimeline.ts` | Usan `isNonEmptyString` |
| `ActivityFeedItem`, `NotificationItem`, `TimelineDate` | Usan `formatDateTime` |
| `pages/LoginPage.tsx` | Tipo `ParsedApiError` reutilizado |
| `assets/hero.png`, `react.svg`, `vite.svg` | **Eliminados** |

---

## Decisiones

- No extraer hook de página compartido — diff mínimo, páginas legibles.
- No cambiar cliente HTTP de Operations — comportamiento observable intacto.
- `HomePage` mantiene `useQuery` inline (única query, no justifica hook).

---

## Deuda remanente

- Operations frontend sin `authenticatedApiClient` (P2 Sprint 18).
- Patrón error/retry repetido en 3 páginas (P2).
- `isFetching` solo en HomePage — inconsistencia menor documentada.

---

## Conclusión

Frontend pequeño y coherente. Se consolidaron utilidades de formato, validación de ID y cliente Axios; se eliminó código muerto en assets. Sin regresión visual ni de rutas.
