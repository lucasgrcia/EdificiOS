# Architecture Review — Sprint 18: Frontend Foundation

**Versión:** `0.18.0-alpha` (Release Candidate)  
**Alcance:** PR1–PR5 — foundation, dashboard, incident viewer, UX, documentación.  
**Restricción:** sin cambios en dominio, Application, Infrastructure, contratos HTTP ni endpoints.

---

## Objetivo

Entregar un **cliente web demostrable** que consuma la API existente de EdificiOS, cerrando el forecast del núcleo del producto:

> Backend sólido + frontend funcional + demostración de punta a punta.

Sprint 18 **no agrega lógica de negocio**. Toda la operación del edificio sigue en el monolito NestJS; el frontend es capa de presentación pura.

| PR | Entregable |
|----|------------|
| PR1 | Frontend Base + Authentication UI + JWT Integration |
| PR2 | Dashboard UI |
| PR3 | Incident Viewer |
| PR4 | UX Improvements (Skeletons, Error Handling, Toasts, Responsive) |
| PR5 | Release Candidate — documentación y versión `0.18.0-alpha` |

---

## Veredicto

**Sprint 18 aprobado como Release Candidate.**

Un operador puede abrir el navegador, autenticarse con JWT manual, ver el dashboard operativo, navegar a una incidencia y revisar su timeline — sin Postman ni modificaciones al backend.

---

## Arquitectura Frontend

### Estructura

```
frontend/src/
├── app/              App.tsx, providers.tsx (Application Shell)
├── api/              client.ts, dashboard.api.ts, incident.api.ts, info.api.ts, auth.api.ts
├── auth/             AuthContext, ProtectedRoute, authToken
├── components/       UI compartida + dashboard/ + incident/ + layout/ + skeleton/
├── hooks/            useAuth, useDashboard, useIncident, useIncidentTimeline
├── layouts/          AppLayout, AuthLayout (Frontend Layout)
├── pages/            HomePage, LoginPage, DashboardPage, IncidentDetailsPage
├── routes/           paths.ts, index.tsx
├── toast/            toastStore, ToastContainer
├── types/            DTOs alineados con vistas HTTP del backend
└── utils/            parseApiError, resolveIncidentIdForFeedEntry
```

### Stack

| Tecnología | Rol |
|------------|-----|
| React 19 | Componentes y estado UI |
| Vite | Dev server (`:5173`) y build |
| React Router | Navegación declarativa |
| TanStack Query | Fetch, cache, loading/error |
| Tailwind CSS v4 | Estilos y responsive |
| Axios | HTTP hacia `/api/v1` |

### Capas de presentación

| Capa | Responsabilidad |
|------|-----------------|
| **Application Shell** | Providers, layout, rutas |
| **Pages** | Composición de pantallas |
| **Hooks** | TanStack Query + API |
| **API** | DTOs tipados, sin alterar contratos |
| **Components** | UI reutilizable (Skeleton, ErrorCard, Toast, etc.) |

---

## Separación UI / API

```
┌─────────────────────────────────────┐
│  Frontend (presentación)            │
│  Pages → Hooks → Axios              │
│  Sin dominio · Sin NestJS           │
└──────────────┬──────────────────────┘
               │ HTTP REST (contratos existentes)
               ▼
┌─────────────────────────────────────┐
│  Backend (monolito NestJS)          │
│  Controllers → Use Cases → Domain   │
└─────────────────────────────────────┘
```

**Reglas respetadas:**

- El frontend **no importa** código del backend.
- **No hay** lógica de negocio en Pages ni Hooks.
- Los DTOs del cliente reflejan `DashboardView`, `IncidentView`, `TimelineEntryView`, etc. — sin campos inventados.
- Los errores HTTP se consumen como RFC 9457; la UI nunca muestra JSON crudo.

---

## Integración Backend

### Proxy de desarrollo

Vite proxea `/api` → `http://localhost:3000`. El navegador ve un solo origen (`:5173`), evitando CORS en local.

### Endpoints consumidos

| Pantalla | Método | Ruta |
|----------|--------|------|
| Home | GET | `/api/v1/info` |
| Dashboard | GET | `/api/v1/operations/dashboard` |
| Incident Viewer | GET | `/api/v1/operations/incidents/:id` |
| Incident Viewer | GET | `/api/v1/operations/incidents/:id/timeline` |
| Auth (opcional) | GET | `/api/v1/authentication/me` |

**Ningún endpoint nuevo.** El frontend solo consume la API documentada en Swagger (`/api/docs`).

### Coherencia de versión

| Fuente | Versión |
|--------|---------|
| `ApplicationConfig` | `0.18.0-alpha` |
| `GET /api/v1/info` | `0.18.0-alpha` |
| `GET /api/v1/health` | `0.18.0-alpha` |
| Swagger metadata | `0.18.0-alpha` |

---

## Autenticación

### Authentication UI (PR1)

- `LoginPage` — el usuario pega un JWT manualmente.
- `AuthContext` — guarda token en `localStorage`.
- `ProtectedRoute` — bloquea `/dashboard` sin token.

### JWT Integration

- `authenticatedApiClient` añade `Authorization: Bearer <token>`.
- Preparado para `GET /api/v1/authentication/me` (Sprint 17).
- **No hay** emisión de tokens ni login con credenciales.

### Demo

Para la demostración alcanza con cualquier valor no vacío (p. ej. `demo`). El dashboard consume `publicApiClient`; Operations sigue público en backend.

---

## Navegación

| Ruta | Componente | Protegida |
|------|------------|-----------|
| `/` | `HomePage` | No |
| `/login` | `LoginPage` | No |
| `/dashboard` | `DashboardPage` | Sí (`ProtectedRoute`) |
| `/incidents/:incidentId` | `IncidentDetailsPage` | No |

**Sidebar:** Inicio, Dashboard.  
**Activity Feed:** clic en incidencia correlacionada → Incident Viewer.

Correlación feed → incident: `resolveIncidentIdForFeedEntry.ts` (heurística con `recentIncidents`; sin `incidentId` en `ActivityFeedEntry` del backend).

---

## Dashboard

**API:** `GET /api/v1/operations/dashboard`  
**Hook:** `useDashboard()`  
**Pantalla:** `DashboardPage`

### Secciones

| Sección | Origen en `DashboardView` |
|---------|---------------------------|
| Dashboard Summary | `summary` |
| Activity Feed | `activityFeed` |
| Notifications | `notifications` (vacío sin `?actorId=`) |

### Componentes

`DashboardMetricCard`, `ActivityFeedList`, `ActivityFeedItem`, `NotificationList`, `NotificationItem`.

### Estados UX (PR4)

Skeletons durante carga, `EmptyState` sin datos, `ErrorCard` con Reintentar, toasts en reintentos.

---

## Incident Viewer

**APIs:**

- `GET /api/v1/operations/incidents/:id` → `IncidentView`
- `GET /api/v1/operations/incidents/:id/timeline` → `TimelineEntryView[]`

**Hooks:** `useIncident()`, `useIncidentTimeline()`  
**Pantalla:** `IncidentDetailsPage`

### Componentes

`IncidentHeader`, `IncidentSummaryCard`, `Timeline`, `TimelineItem`, `TimelineIcon`, `TimelineDate`.

### Limitaciones documentadas

- `priority` y `site` muestran `—` (`IncidentView` no los expone).
- Solo lectura: sin acciones detect/assign/resolve desde UI.

---

## Trade-offs

| Trade-off | Decisión | Alternativa descartada |
|-----------|----------|------------------------|
| JWT manual vs login form | Pegar token en LoginPage | Simular credenciales sin backend |
| `ProtectedRoute` solo en `/dashboard` | Alcance MVP | Proteger Operations (requiere autorización backend) |
| Heurística feed → incident | Cliente correlaciona con `recentIncidents` | Agregar `incidentId` al DTO del backend |
| Sin selector `actorId` | Notifications vacías por defecto | UI de filtros sin Field Story |
| Sin tests E2E frontend | Build + QA manual | Playwright fuera de alcance RC |
| TanStack Query vs Redux | Query para server state | Estado global innecesario en MVP |
| Health version desincronizada | Documentado en backlog | Cambiar `HealthModule` en PR documental |

---

## Deuda

Ítems P2 en `docs/architecture_backlog.md` (Sprint 18 — Frontend):

| Ítem | Justificación |
|------|---------------|
| Login real | Sin endpoint de credenciales |
| Refresh Token | JWT en `localStorage` sin rotación |
| Actor selector | Backend soporta `?actorId=`; UI no lo expone |
| CRUD de Incident desde UI | Solo lectura en Incident Viewer |
| CRUD de Assets desde UI | Sin pantallas de registro/gestión |
| Filtros | Sin búsqueda ni filtros por Site/Status |
| Paginación | Listas con límite fijo del backend |

Deuda adicional documentada (no inventada): mark as read en Notifications UI, tests E2E frontend, API URL en build de producción.

---

## Conclusión

Sprint 18 cierra el núcleo del producto en **`0.18.0-alpha` (Release Candidate)**:

- **Backend completo** — 63 suites, 621 tests, API operativa.
- **Frontend funcional** — Application Shell, Dashboard, Incident Viewer, UX pulida.
- **Arquitectura consistente** — UI separada de API; contratos HTTP intactos.
- **Listo para demostraciones** — ver `docs/GUIA_USO.md`.

Los sprints posteriores son evolución funcional (login real, CRUD desde UI, filtros, paginación) basada en necesidades del edificio — no construcción del walking skeleton.

**Backend tests:** 621/621 OK · 63 test suites · Build OK  
**Frontend build:** OK (`npm run build` en `frontend/`)
