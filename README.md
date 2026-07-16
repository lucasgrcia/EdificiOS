# EdificiOS

Sistema operativo para la operación diaria de edificios. Modela trabajo operativo mediante eventos, no tickets.

**Versión actual:** `0.18.0-alpha` (Release Candidate)

Este documento es el **único punto de entrada** para levantar, demostrar y retomar el proyecto.

---

## ¿Qué es `0.18.0-alpha`?

| | |
|---|---|
| **Qué es** | Release Candidate — primera versión **demostrable de punta a punta** |
| **Qué incluye** | Backend NestJS (Operations + Authentication), PostgreSQL en Docker, cliente web React, login por email, dashboard operativo, visor de incidencias, outbox transaccional, Swagger, 658 tests backend + 40 tests frontend |
| **Para qué sirve** | Presentar el producto, validar arquitectura, onboarding de desarrolladores, base para evolución hacia `1.0` |
| **Qué NO es** | Versión de producción. Sin roles, sin refresh tokens, sin despliegue cloud documentado |

### Qué queda para la futura `1.0`

- Resolver deuda **P1** del [architecture backlog](docs/architecture_backlog.md) (Event Log, concurrencia, integridad referencial)
- Hardening de seguridad (autorización granular, rotación de tokens)
- Acciones de escritura desde la UI (detectar, asignar, resolver incidencias)
- Observabilidad exportable y despliegue productivo
- Tests E2E del flujo completo

Detalle: sección [Known Limitations](#known-limitations) más abajo.

---

## Inicio rápido

Requisitos: **Node.js 20.x**, **npm 10.x**, **Docker**.

```bash
# 1. Clonar e instalar
git clone <url-del-repositorio>
cd EdificiOS
npm install

# 2. Variables de entorno
cp .env.example .env
# PowerShell: Copy-Item .env.example .env

# 3. Base de datos (Docker + migraciones)
npm run db:setup

# 4. Verificar backend
npm run build
npm test

# 5. Levantar API (exportar .env primero — ver nota abajo)
npm run start:dev

# 6. Levantar frontend (otra terminal)
cd frontend
npm install
npm run dev
```

| Servicio | URL |
|----------|-----|
| API | http://localhost:3000 |
| Swagger | http://localhost:3000/api/docs |
| Frontend | http://localhost:5173 |
| Health | http://localhost:3000/api/v1/health |
| Info | http://localhost:3000/api/v1/info |

> **Importante:** NestJS no carga `.env` automáticamente. Antes de `npm run start:dev`, exportá las variables en tu shell:
>
> ```powershell
> # PowerShell
> Get-Content .env | ForEach-Object {
>   if ($_ -match '^(?<key>[^#=]+)=(?<value>.*)$') {
>     Set-Item -Path "env:$($matches.key)" -Value $matches.value
>   }
> }
> ```
>
> ```bash
> # Linux / macOS
> export $(grep -v '^#' .env | xargs)
> ```

### Primera demo

1. Completar el [inicio rápido](#inicio-rápido) anterior.
2. Crear datos de bootstrap (usuario + incidencia) — una vez por entorno vacío. Ver [docs/DEMO.md](docs/DEMO.md).
3. Seguir el guión de presentación: [docs/DEMO.md](docs/DEMO.md) (10–15 min, solo interfaz web).

Antes de presentar o etiquetar, usar [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md).

---

## Estructura del repositorio

```
EdificiOS/
├── src/                      # Backend NestJS (monolito modular, Clean Architecture)
│   ├── operations/           # Bounded context: Incident, Evidence, Site, Shift, …
│   ├── authentication/       # Bounded context: usuarios, login JWT, /me
│   ├── health/               # GET /health
│   ├── info/                 # GET /info
│   ├── outbox/               # Transactional Outbox
│   ├── config/               # ApplicationConfig
│   └── shared/               # Shared kernel (HTTP helpers, pools, DTOs Swagger)
├── frontend/                 # Cliente web React 19 + Vite + TanStack Query
│   └── src/
│       ├── api/              # Clientes Axios (public + authenticated)
│       ├── auth/             # AuthContext, ProtectedRoute, sesión
│       ├── pages/            # Home, Login, Dashboard, Incidents, IncidentDetails
│       ├── components/       # UI, dashboard/, incident/, layout/
│       └── hooks/            # TanStack Query hooks
├── test/                     # Tests de integración backend (Jest)
├── docs/                     # Documentación del proyecto
│   ├── DEMO.md               # Guía de presentación (10–15 min)
│   ├── RELEASE_CHECKLIST.md  # Verificación pre-release
│   ├── GUIA_USO.md           # Guía operativa detallada
│   ├── architecture_backlog.md
│   └── architecture_reviews/
├── scripts/                  # migrate.js, wait-for-postgres.js
├── docker-compose.yml        # PostgreSQL 16
├── AGENTS.md                 # Constitución de ingeniería
└── package.json
```

---

## Comandos principales

### Raíz — backend, Docker, migraciones

| Comando | Descripción |
|---------|-------------|
| `npm run build` | Compila el backend TypeScript |
| `npm test` | Tests backend — **70 suites / 658 tests** |
| `npm run start` | Inicia la API en producción local |
| `npm run start:dev` | API con recarga en caliente (`:3000`) |
| `npm run db:up` | Levanta PostgreSQL (Docker) |
| `npm run db:down` | Detiene PostgreSQL |
| `npm run db:migrate` | Aplica migraciones SQL |
| `npm run db:setup` | `db:up` + espera + `db:migrate` |
| `npm run db:reset` | Elimina volumen y recrea PostgreSQL |

### `frontend/` — cliente web

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo (`:5173`, proxy a API) |
| `npm run build` | Build de producción |
| `npm test` | Tests frontend — **14 suites / 40 tests** |
| `npm run preview` | Sirve `dist/` localmente |

### Verificación completa (pre-release)

```bash
# Backend
npm run build && npm test

# Frontend
cd frontend && npm run build && npm test
```

Checklist detallado: [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md).

---

## Demo funcional (interfaz web)

El recorrido completo **no requiere Swagger** durante la presentación:

```
Home → Login → Dashboard → Incidencia → Timeline → Dashboard → Logout
```

| Pantalla | Ruta | API principal |
|----------|------|---------------|
| Home | `/` | `GET /api/v1/info` |
| Login | `/login` | `POST /authentication/login`, `GET /authentication/me` |
| Dashboard | `/dashboard` | `GET /operations/dashboard` |
| Incidencias | `/incidents` | Reutiliza caché del dashboard |
| Detalle | `/incidents/:id` | `GET incidents/:id`, `GET .../timeline` |

- **Guía de presentación:** [docs/DEMO.md](docs/DEMO.md)
- **Cliente web:** [frontend/README.md](frontend/README.md)
- **Troubleshooting:** [docs/GUIA_USO.md](docs/GUIA_USO.md)

---

## Variables de entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `DATABASE_URL` | Conexión PostgreSQL | `postgresql://edificios:edificios@localhost:5432/edificios` |
| `EVIDENCE_STORAGE_PATH` | Directorio de Evidence | `./storage/evidences` |

---

## Known Limitations

Deuda técnica **documentada y aceptada** en `0.18.0-alpha`. No se oculta; el detalle priorizado vive en [docs/architecture_backlog.md](docs/architecture_backlog.md).

### P1 — impacto estructural (resolver antes de `1.0`)

| Ítem | Resumen |
|------|---------|
| Event Log incompleto | `workflow.flow.detected` sin `assetId`/`shiftId`/`actorId` en payload |
| Integridad referencial | Validación de Site/Actor inconsistente entre casos de uso |
| Dos `ActorId` | UUID en Actor vs string libre en Evidence |
| Concurrencia optimista | Transiciones concurrentes sin guard en proyección |
| Mapeo HTTP | Errores de dominio que devuelven 500 en lugar de 409/404 |

### P2 — deuda consciente (selección relevante para demo)

| Área | Limitación |
|------|------------|
| **Frontend** | UI de solo lectura; sin CRUD de incidencias/assets; sin selector de `actorId`; sin E2E Playwright |
| **Authentication** | Sin passwords, refresh tokens, roles ni permisos granulares |
| **Arquitectura** | Operations importa `JwtAuthenticationGuard` de Authentication ([AR03](docs/architecture_reviews/architecture_review_03_bounded_contexts.md)) |
| **API** | `/authentication/me` sin `actorId`; dashboard acepta `?actorId=` pero la UI usa el del usuario cuando exista |
| **Operaciones** | Activity feed y timeline con límites fijos; sin paginación en UI |
| **Plataforma** | Versión hardcodeada en `ApplicationConfig`; sin métricas Prometheus exportables |

### Deliberadamente ausente (no es deuda)

Passwords, RabbitMQ, CQRS completo, Event Sourcing completo, Foreign Keys entre agregados, microservicios. Ver [architecture_backlog.md — Deliberadamente ausente](docs/architecture_backlog.md).

---

## Arquitectura (resumen)

- **Monolito modular** con Clean Architecture (`domain → application → infrastructure`).
- **Event Log** append-only como fuente de verdad operativa.
- **Transactional Outbox** para publicación futura de eventos.
- **Dominio puro:** TypeScript sin NestJS, Prisma ni PostgreSQL.
- **Evidence** respalda Domain Events (ADR-006), no Incident directamente.

Antes de proponer cambios: leer [AGENTS.md](AGENTS.md) y las reglas en `docs/06_rules.md`.

---

## Documentación

| Documento | Contenido |
|-----------|-----------|
| **[docs/DEMO.md](docs/DEMO.md)** | Guía de presentación 10–15 min |
| **[docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md)** | Verificación pre-release |
| [docs/GUIA_USO.md](docs/GUIA_USO.md) | Guía operativa local (DB, API, troubleshooting) |
| [docs/05_current_status.md](docs/05_current_status.md) | Estado actual del proyecto |
| [docs/architecture_backlog.md](docs/architecture_backlog.md) | Deuda técnica priorizada (P1 / P2) |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Historial de cambios |
| [docs/glossary.md](docs/glossary.md) | Lenguaje ubicuo |
| [docs/01_architecture.md](docs/01_architecture.md) | Capas y persistencia |
| [frontend/README.md](frontend/README.md) | Cliente web |
| [docs/architecture_reviews/](docs/architecture_reviews/) | Architecture Reviews por sprint |

---

## Licencia

ISC (ver `package.json`).
