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

## Pantallas

| Ruta | Descripción | API |
|------|-------------|-----|
| `/` | Metadatos de la API | `GET /api/v1/info` |
| `/login` | Guardar JWT manualmente | — |
| `/dashboard` | Summary, Activity Feed, Notifications | `GET /api/v1/operations/dashboard` |
| `/incidents/:id` | Detalle y timeline de incidencia | `GET incidents/:id`, `GET .../timeline` |

---

## Autenticación (demo)

El backend no expone login ni emisión de JWT. Para acceder al dashboard:

1. Obtener un JWT válido (generado externamente con el `jwtSecret` de `ApplicationConfig`).
2. Ir a `/login` y pegar el token.
3. El token se guarda en `localStorage` y se envía como `Authorization: Bearer` en requests autenticados.

`ProtectedRoute` protege solo `/dashboard`. Operations sigue siendo público en backend.

---

## Estructura

```
src/
├── api/           Clientes Axios (public + authenticated)
├── auth/          AuthContext, ProtectedRoute, authToken
├── components/    UI compartida, dashboard/, incident/, layout/, skeleton/
├── hooks/         TanStack Query hooks
├── layouts/       AppLayout, AuthLayout
├── pages/         Home, Login, Dashboard, IncidentDetails
├── routes/        Definición de rutas
├── toast/         Sistema de notificaciones
├── types/         DTOs alineados con el backend
└── utils/         parseApiError, resolveIncidentIdForFeedEntry
```

---

## Documentación

- Estado del proyecto: [docs/05_current_status.md](../docs/05_current_status.md)
- Architecture Review: [docs/architecture_reviews/sprint_18_frontend_foundation.md](../docs/architecture_reviews/sprint_18_frontend_foundation.md)
- Glosario frontend: [docs/glossary.md](../docs/glossary.md) (sección *Frontend — capa de presentación*)
