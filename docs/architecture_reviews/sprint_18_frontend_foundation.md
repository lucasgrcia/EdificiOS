# Architecture Review — Sprint 18: Frontend Foundation

**Objetivo:** entregar un cliente web demostrable que consuma la API existente de EdificiOS — sin modificar backend, contratos HTTP ni lógica de negocio.  
**Alcance revisado:** PR1–PR5 (foundation, dashboard, incident details, UX polish, release candidate).

---

## Veredicto

**Sprint 18 es aprobable como Release Candidate (`0.18.0-alpha`).**

El sistema alcanza el punto definido en el forecast: **backend sólido + frontend funcional + demostración de punta a punta**. Un operador puede abrir el navegador, pegar un JWT, ver el dashboard operativo, navegar a una incidencia y revisar su timeline.

**Sprint 18 NO agrega dominio ni endpoints.** Toda la lógica de negocio permanece en el monolito NestJS. El frontend es capa de presentación pura.

---

## Objetivo

1. **Foundation (PR1)** — stack React, routing, auth JWT en cliente, layouts y componentes base
2. **Dashboard UI (PR2)** — consumir `GET /operations/dashboard` con summary, activity feed y notifications
3. **Incident Details UI (PR3)** — consumir incident + timeline; navegación desde activity feed
4. **UX Polish (PR4)** — skeletons, empty/error states, toasts, responsive, accesibilidad, consistencia visual
5. **Release Candidate (PR5)** — documentación, versión `0.18.0-alpha`, cierre de sprint

---

## Arquitectura

### Estructura del frontend

```
frontend/src/
├── app/              App.tsx, providers.tsx (Query + Auth + Toast)
├── api/              client.ts, dashboard.api.ts, incident.api.ts, info.api.ts, auth.api.ts
├── auth/             AuthContext, ProtectedRoute, authToken
├── components/       UI compartida + dashboard/ + incident/ + layout/ + skeleton/
├── hooks/            useAuth, useDashboard, useIncident, useIncidentTimeline
├── layouts/          AppLayout, AuthLayout
├── pages/            HomePage, LoginPage, DashboardPage, IncidentDetailsPage
├── routes/           paths.ts, index.tsx
├── toast/            toastStore, ToastContainer
├── types/            DTOs alineados con vistas HTTP del backend
└── utils/            parseApiError, resolveIncidentIdForFeedEntry
```

### Separación frontend / backend

| Capa | Responsabilidad | Restricción |
|------|-----------------|-------------|
| **Pages** | Componer UI, estados loading/error/empty | Sin lógica de negocio |
| **Hooks** | TanStack Query + llamadas API | Sin transformaciones de dominio |
| **API** | Axios + DTOs tipados | Sin cambiar contratos HTTP |
| **Auth** | Persistir JWT en `localStorage`, Bearer en requests | Sin emisión de tokens |
| **Utils** | Mapeo de errores RFC 9457 a mensajes UI | Sin exponer JSON crudo |

**Regla respetada:** el frontend no importa código del backend. Solo consume endpoints documentados en OpenAPI.

---

## Flujo demostrable (E2E)

```
1. Backend en :3000 (NestJS + PostgreSQL)
2. Frontend en :5173 (Vite dev server, proxy /api → :3000)
3. Home (/) → GET /api/v1/info → metadatos de la API
4. Login (/login) → usuario pega JWT → localStorage
5. Dashboard (/dashboard) → GET /api/v1/operations/dashboard
     ├── summary (métricas)
     ├── activityFeed (clic → /incidents/:id si correlaciona)
     └── notifications
6. Incident Details (/incidents/:id)
     ├── GET /api/v1/operations/incidents/:id
     └── GET /api/v1/operations/incidents/:id/timeline
```

**Autenticación en demo:** el login actual guarda un JWT pegado manualmente. No existe endpoint de login en backend (deuda documentada). El dashboard no requiere JWT hoy (Operations es público); la infraestructura JWT está preparada para cuando se protejan rutas.

---

## Pantallas

| Pantalla | Ruta | APIs consumidas | Estado |
|----------|------|-----------------|--------|
| **Home** | `/` | `GET /api/v1/info` | ✔ |
| **Login** | `/login` | — (JWT manual) | ✔ |
| **Dashboard** | `/dashboard` | `GET /api/v1/operations/dashboard` | ✔ |
| **Incident Details** | `/incidents/:incidentId` | `GET incidents/:id`, `GET .../timeline` | ✔ |

---

## Componentes transversales (PR4)

| Componente | Rol |
|------------|-----|
| `SkeletonCard`, `SkeletonList`, `SkeletonTimeline` | Loading states reutilizables |
| `EmptyState` + `EmptyStateIcon` | Estados vacíos con icono, título, descripción |
| `ErrorCard` | Errores con Reintentar; nunca JSON |
| `parseApiError` | RFC 9457 → título + descripción amigable |
| `toastStore` + `ToastContainer` | Feedback global (login, logout, red, operaciones) |

---

## Decisiones tomadas

| Decisión | Razón |
|----------|-------|
| Vite + proxy `/api` | Desarrollo local sin CORS; mismo origen en :5173 |
| TanStack Query | Cache, refetch, estados loading/error sin boilerplate |
| JWT en `localStorage` | MVP demo; refresh token fuera de alcance |
| Login = pegar token | Backend sin endpoint de credenciales; honesto en UI |
| `ProtectedRoute` solo en `/dashboard` | Incident details accesible sin auth (Operations público) |
| `priority` y `site` como `—` en UI | `IncidentView` del backend no expone esos campos |
| Correlación feed → incident vía `recentIncidents` | Sin `incidentId` en `ActivityFeedEntry`; heurística en cliente |
| Toasts centralizados | Una infraestructura para éxito, error e info |
| Tailwind v4 | Consistencia visual rápida sin design system externo |

---

## Ventajas

- **Demostración inmediata:** operador ve datos reales del edificio sin Postman
- **Contratos intactos:** cero cambios en backend; frontend tipado contra vistas existentes
- **Extensible:** nuevas pantallas siguen el patrón pages → hooks → api → components
- **UX consistente:** skeletons, empty states y errores unificados en cuatro pantallas
- **Preparado para auth real:** Bearer interceptor, ProtectedRoute y login page listos

---

## Trade-offs

| Trade-off | Decisión | Alternativa descartada |
|-----------|----------|------------------------|
| JWT manual vs login form | Pegar token | Simular login sin backend (ocultaría deuda real) |
| Sin tests E2E frontend | Build + manual QA | Playwright en RC (fuera de alcance PR5) |
| Heurística feed → incident | `resolveIncidentIdForFeedEntry` | Cambiar `ActivityFeedEntry` en backend (prohibido) |
| Dashboard sin selector `actorId` | Lista notifications vacía por defecto | UI de filtros sin diseño de campo |
| Health version desincronizada | Documentado en backlog | Modificar `HealthModule` en sprint de docs |

---

## Deuda pendiente (frontend)

Ítems P2 en `docs/architecture_backlog.md` (sección Sprint 18 — Frontend):

- Login real (credenciales + emisión JWT desde backend)
- Refresh token y renovación de sesión
- Paginación en listas (activity feed, notifications, timeline)
- Filtros avanzados (dashboard por `actorId`, búsqueda de incidencias)
- Campos UI pendientes (`priority`, `site`) hasta que el backend los exponga
- Tests automatizados del frontend (unit + E2E)
- Configuración de API URL para build de producción

---

## Conclusión

Sprint 18 cierra el núcleo del producto definido en el forecast: **monolito operativo + cliente web demostrable**. A partir de `0.18.0-alpha`, los sprints adicionales son evolución funcional basada en necesidades reales del edificio, no construcción del walking skeleton.

El siguiente paso natural del producto es credenciales reales (login + password + emisión JWT) y protección progresiva de endpoints Operations — sin refactor de la arquitectura actual.

**Versión:** `0.18.0-alpha` (Release Candidate)  
**Backend tests:** 621/621 OK · 63 test suites · Build OK  
**Frontend build:** OK (`npm run build` en `frontend/`)
