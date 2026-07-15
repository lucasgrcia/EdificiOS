# Guía de uso — EdificiOS `0.18.0-alpha`

Guía práctica para levantar y usar los entornos locales del Release Candidate: **PostgreSQL (Docker)**, **backend (API)** y **frontend (web)**.

**Alcance:** Sprint 18 cerrado. Demostración de punta a punta sin login real ni acciones de escritura desde la UI.

---

## 1. Los tres entornos

| Entorno | Puerto | Rol | Cómo arranca |
|---------|--------|-----|--------------|
| **PostgreSQL** | `5432` | Persistencia (sites, incidencias, notificaciones, etc.) | `npm run db:up` |
| **Backend (API)** | `3000` | NestJS — lógica y datos | `npm run start:dev` |
| **Frontend (web)** | `5173` | React — interfaz de demo | `cd frontend && npm run dev` |

```
Navegador (:5173)
    └── proxy /api → Backend (:3000)
                          └── PostgreSQL (:5432)
```

El frontend **no accede a la base de datos directamente**. Todas las pantallas consumen la API REST.

---

## 2. Requisitos previos

| Herramienta | Versión mínima |
|-------------|----------------|
| Node.js | 20.x |
| npm | 10.x |
| Docker | Para PostgreSQL local |

---

## 3. Configuración inicial (primera vez)

Desde la raíz del repositorio:

```powershell
# Dependencias del backend
npm install

# Variables de entorno
Copy-Item .env.example .env

# Base de datos + migraciones
npm run db:setup

# Dependencias del frontend
cd frontend
npm install
cd ..
```

El archivo `.env` debe contener:

| Variable | Valor por defecto |
|----------|-------------------|
| `DATABASE_URL` | `postgresql://edificios:edificios@localhost:5432/edificios` |
| `EVIDENCE_STORAGE_PATH` | `./storage/evidences` |

---

## 4. Arranque diario

Usá **tres terminales** (o dos si PostgreSQL ya está corriendo).

### Terminal A — Base de datos

```powershell
cd C:\Users\USUARIO\Documents\EdificiOS
npm run db:up
```

Verificá que el contenedor esté activo:

```powershell
docker ps
```

> **Solo la primera vez** (o tras `npm run db:reset`): `npm run db:migrate`

---

### Terminal B — Backend

NestJS **no carga `.env` automáticamente**. Exportá las variables en cada terminal nueva:

```powershell
cd C:\Users\USUARIO\Documents\EdificiOS

Get-Content .env | ForEach-Object {
  if ($_ -match '^(?<key>[^#=]+)=(?<value>.*)$') {
    Set-Item -Path "env:$($matches.key)" -Value $matches.value
  }
}

npm run start:dev
```

Esperá el mensaje: `Nest application successfully started`.

**Verificación en el navegador:**

| URL | Resultado esperado |
|-----|-------------------|
| http://localhost:3000/api/v1/info | Metadatos de la API (`0.18.0-alpha`) |
| http://localhost:3000/api/v1/health | `"status": "UP"`, `"database": "UP"` |
| http://localhost:3000/api/docs | Swagger UI |

---

### Terminal C — Frontend

```powershell
cd C:\Users\USUARIO\Documents\EdificiOS\frontend
npm run dev
```

Abrí: **http://localhost:5173**

---

## 5. Guía del frontend (web)

### Pantallas

| Pantalla | URL | Requiere login | API consumida |
|----------|-----|----------------|---------------|
| **Inicio** | `/` | No | `GET /api/v1/info` |
| **Login** | `/login` | — | — (JWT manual) |
| **Dashboard** | `/dashboard` | Sí* | `GET /api/v1/operations/dashboard` |
| **Detalle de incidencia** | `/incidents/{id}` | No | `GET incidents/:id`, `GET .../timeline` |

\* `ProtectedRoute` exige un token guardado en el navegador. Para la demo alcanza con pegar `demo`. La API del dashboard es pública en backend; la ruta `/dashboard` solo comprueba que haya *algo* en `localStorage`.

---

### Flujo típico

```
1. Inicio (/)           → confirmar que la API responde
2. Login (/login)       → pegar "demo" → Guardar token y continuar
3. Dashboard            → métricas, Activity Feed, Notifications
4. Activity Feed        → clic en incidencia → Detalle + Timeline
5. Cerrar sesión        → botón en el header
```

---

### Dashboard — secciones

**Dashboard Summary**  
Totales operativos: sites, assets, turnos activos, incidencias abiertas, órdenes de trabajo, notificaciones pendientes.

**Activity Feed**  
Últimas 20 entradas mezcladas (`EVENT`, `INCIDENT`, `WORK_ORDER`, `NOTIFICATION`). Las incidencias con enlace abren `/incidents/{id}`.

**Notifications**  
Lista de notificaciones del actor. Sin `actorId` en la consulta suele estar vacía; comportamiento esperado en esta versión.

**Estados de UI (Sprint 18 PR4):**

- **Skeletons** mientras carga.
- **Empty states** con icono, título y descripción si no hay datos.
- **ErrorCard** con botón Reintentar si la API falla (sin JSON crudo).
- **Toasts** para login, logout, errores de red y reintentos.

---

### Detalle de incidencia

Muestra:

- ID, status, descripción, actor, fecha de creación
- **Priority** y **Site** como `—` (`IncidentView` del backend no los expone aún)
- **Timeline** cronológico: eventos, evidencias, órdenes, notificaciones

Volvé al dashboard con **← Volver al dashboard**.

---

### Navegación

- **Sidebar:** Inicio, Dashboard (en móvil: menú hamburguesa).
- **Header:** “Panel operativo” + **Cerrar sesión**.

---

## 6. Guía de la API (backend)

### Swagger — forma recomendada de crear datos

**http://localhost:3000/api/docs**

Permite probar endpoints sin escribir `curl`.

### Cadena para detectar una incidencia

El sistema exige este orden:

```
1. POST /api/v1/operations/sites
2. POST /api/v1/operations/assets              (requiere siteId)
3. POST /api/v1/operations/actors              (requiere siteId)
4. POST /api/v1/operations/sites/{siteId}/shifts/start
5. POST /api/v1/operations/incidents             (assetId + description)
```

Tras el paso 5, el Dashboard y el Activity Feed deberían mostrar la incidencia.

### Endpoints útiles para la demo

| Acción | Método y ruta |
|--------|----------------|
| Estado del sistema | `GET /api/v1/health` |
| Info de la API | `GET /api/v1/info` |
| Dashboard | `GET /api/v1/operations/dashboard` |
| Listar incidencias | `GET /api/v1/operations/incidents` |
| Ver incidencia | `GET /api/v1/operations/incidents/{id}` |
| Timeline | `GET /api/v1/operations/incidents/{id}/timeline` |
| Crear usuario | `POST /api/v1/authentication/users` |
| Usuario actual | `GET /api/v1/authentication/me` (requiere Bearer JWT) |

---

## 7. Autenticación (demo)

No existe login con usuario y contraseña en esta versión.

| Escenario | Qué hacer |
|-----------|-----------|
| Entrar al Dashboard en la web | Pegar cualquier texto (`demo`) en `/login` |
| Probar `GET /me` con JWT real | Crear usuario vía API → generar JWT |

**Configuración JWT (desarrollo):**

| Parámetro | Valor |
|-----------|-------|
| Secret | `edificios-dev-jwt-secret` |
| Issuer | `edificios-api` |
| Audience | `edificios-clients` |
| Payload | `{ "userId": "<uuid-del-usuario>" }` |

---

## 8. Comandos de referencia

### Base de datos

| Comando | Acción |
|---------|--------|
| `npm run db:up` | Levantar PostgreSQL |
| `npm run db:down` | Detener PostgreSQL |
| `npm run db:migrate` | Aplicar migraciones SQL |
| `npm run db:setup` | `db:up` + esperar + `db:migrate` |
| `npm run db:reset` | Borrar volumen y recrear DB |

### Backend

| Comando | Acción |
|---------|--------|
| `npm run start:dev` | API con recarga en caliente (`:3000`) |
| `npm run build` | Compilar backend |
| `npm test` | Tests de integración (621 tests) |

### Frontend

| Comando | Acción |
|---------|--------|
| `npm run dev` | Desarrollo (`:5173`, proxy a API) |
| `npm run build` | Build de producción |
| `npm run preview` | Servir `dist/` localmente |

---

## 9. Demo completa en 10 minutos

```
□ Terminal A: npm run db:up
□ Terminal B: cargar .env → npm run start:dev
□ Terminal C: cd frontend → npm run dev
□ Navegador: localhost:3000/api/v1/health → UP
□ Swagger: crear Site → Asset → Actor → Shift → Incident
□ Web: localhost:5173/login → pegar "demo"
□ Web: localhost:5173/dashboard → ver métricas y feed
□ Clic en incidencia → ver timeline
```

---

## 10. Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| Dashboard: Internal Server Error | DB sin migrar o `DATABASE_URL` no cargada | `npm run db:migrate` + reiniciar backend con `.env` exportado |
| `DATABASE_URL is required` en migrate | Falta `.env` | `Copy-Item .env.example .env` |
| Health: `database` no es UP | Docker apagado | `npm run db:up` |
| Frontend: error de red | Backend no en `:3000` | `npm run start:dev` con variables cargadas |
| Dashboard vacío | Base sin datos | Crear datos vía Swagger (sección 6) |
| Redirige a `/login` | Sin token en el navegador | Pegar `demo` en login |
| Notifications vacías | Sin `actorId` en la consulta del dashboard | Comportamiento esperado en `0.18.0-alpha` |

---

## 11. Limitaciones de esta versión

Documentadas en `docs/architecture_backlog.md` (sección Sprint 18 — Frontend):

- Login real con credenciales y emisión de JWT desde la app
- Refresh token y renovación de sesión
- Paginación y filtros avanzados (p. ej. selector de `actorId` en dashboard)
- Listado dedicado de incidencias con búsqueda
- Acciones desde la UI (detectar, asignar, resolver, crear work orders)
- Campos `priority` y `site` en detalle de incidencia
- Tests automatizados del frontend (E2E)
- Despliegue en producción con URL de API configurable

---

## 12. Documentación relacionada

| Documento | Contenido |
|-----------|-----------|
| [README.md](../README.md) | Onboarding técnico del repositorio |
| [frontend/README.md](../frontend/README.md) | Cliente web |
| [05_current_status.md](05_current_status.md) | Estado del proyecto |
| [architecture_reviews/sprint_18_frontend_foundation.md](architecture_reviews/sprint_18_frontend_foundation.md) | Architecture Review Sprint 18 |
| [glossary.md](glossary.md) | Lenguaje ubicuo (dominio + frontend) |
| [architecture_backlog.md](architecture_backlog.md) | Deuda priorizada |

---

**Versión:** `0.18.0-alpha` (Release Candidate)  
**Última actualización:** 2026-07-14
