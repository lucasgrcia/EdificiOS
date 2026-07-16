# EdificiOS — Frontend

Cliente web del Release Candidate `0.18.0-alpha`. Consume la API REST existente sin modificar contratos ni lógica de negocio.

---

## Requisitos

- Node.js 20.x
- Backend EdificiOS en `http://localhost:3000`

---

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Las peticiones a `/api` se proxean a `:3000` (ver `vite.config.ts`).

---

## Build

```bash
npm run build
npm run preview   # opcional: servir dist localmente
```

---

## Demo funcional (solo interfaz web)

El recorrido completo del producto se realiza sin Swagger ni Postman:

```
Home → Login → Dashboard → Incidencia → Timeline → Dashboard → Logout
```

### Pasos

1. **Home** (`/`): verificar versión y estado del backend (`GET /api/v1/info`). Si no hay sesión, usar **Iniciar sesión**.
2. **Login** (`/login`): ingresar email y acceder al panel.
3. **Dashboard** (`/dashboard`): métricas, incidencias recientes, activity feed y notificaciones (`GET /api/v1/operations/dashboard`).
4. **Incidencia** (`/incidents/:id`): abrir una incidencia desde el dashboard o desde **Incidencias** (`/incidents`, reutiliza caché del dashboard).
5. **Timeline**: sección en el detalle de la incidencia (`GET .../timeline`).
6. **Volver al Dashboard**: enlaces de retorno en detalle, timeline e incidencias.
7. **Logout**: desde el sidebar; limpia sesión y redirige a login.

---

## Pantallas

| Ruta | Descripción | API |
|------|-------------|-----|
| `/` | Bienvenida, versión y estado del backend | `GET /api/v1/info` |
| `/login` | Inicio de sesión por email | `POST /authentication/login`, `GET /authentication/me` |
| `/dashboard` | Summary, incidencias recientes, activity feed, notifications | `GET /api/v1/operations/dashboard` |
| `/incidents` | Listado de incidencias desde caché del dashboard | — (reutiliza dashboard) |
| `/incidents/:id` | Detalle y timeline de incidencia | `GET incidents/:id`, `GET .../timeline` |

---

## Autenticación

- El token JWT se guarda en `localStorage` y se envía como `Authorization: Bearer` en requests autenticados.
- La sesión se restaura al iniciar la app (`GET /authentication/me`).
- Un `401` en requests autenticadas cierra la sesión y redirige a login.
- `ProtectedRoute` protege `/dashboard` e `/incidents`.

---

## Estructura

```
src/
├── api/           Clientes Axios (public + authenticated)
├── auth/          AuthContext, ProtectedRoute, authToken
├── components/    UI compartida, dashboard/, incident/, layout/, skeleton/
├── hooks/         TanStack Query hooks
├── layouts/       AppLayout, AuthLayout
├── pages/         Home, Login, Dashboard, Incidents, IncidentDetails
├── routes/        Definición de rutas y breadcrumbs
├── toast/         Sistema de notificaciones
├── types/         DTOs alineados con el backend
└── utils/         parseApiError, resolveIncidentIdForFeedEntry
```

---

## Documentación

- **Demo (presentación):** [docs/DEMO.md](../docs/DEMO.md)
- **Checklist pre-release:** [docs/RELEASE_CHECKLIST.md](../docs/RELEASE_CHECKLIST.md)
- Punto de entrada del repositorio: [README.md](../README.md)
- Estado del proyecto: [docs/05_current_status.md](../docs/05_current_status.md)
- Architecture Review: [docs/architecture_reviews/sprint_18_frontend_foundation.md](../docs/architecture_reviews/sprint_18_frontend_foundation.md)
- Glosario frontend: [docs/glossary.md](../docs/glossary.md) (sección *Frontend — capa de presentación*)
- Guía de uso: [docs/GUIA_USO.md](../docs/GUIA_USO.md)
