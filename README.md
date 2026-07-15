# EdificiOS

Sistema operativo para la operación diaria de edificios. Modela trabajo operativo mediante eventos, no tickets.

**Versión actual:** `0.18.0-alpha` (Release Candidate — demostrable de punta a punta).

Este README permite levantar el proyecto desde cero sin conocimiento previo del código.

---

## Requisitos

| Herramienta | Versión mínima |
|-------------|----------------|
| Node.js | 20.x |
| npm | 10.x |
| Docker | Para PostgreSQL local |

---

## Inicio rápido

```bash
# 1. Clonar
git clone <url-del-repositorio>
cd EdificiOS

# 2. Instalar dependencias
npm install

# 3. Variables de entorno
cp .env.example .env
# En PowerShell: Copy-Item .env.example .env

# 4. Levantar PostgreSQL
npm run db:up

# 5. Aplicar migraciones (base de datos vacía)
npm run db:migrate

# 6. Verificar que todo compila y los tests pasan
npm run build
npm test

# 7. Levantar la aplicación
npm run start:dev
```

La API queda disponible en `http://localhost:3000`.

> **Nota:** NestJS no carga `.env` automáticamente. Antes de `npm run start` o `npm run start:dev`, exportá las variables en tu shell:
>
> ```bash
> # Linux / macOS
> export $(grep -v '^#' .env | xargs)
>
> # PowerShell
> Get-Content .env | ForEach-Object {
>   if ($_ -match '^(?<key>[^#=]+)=(?<value>.*)$') {
>     Set-Item -Path "env:$($matches.key)" -Value $matches.value
>   }
> }
> ```

### Frontend (demostración)

```bash
cd frontend
npm install
npm run dev
```

El cliente web queda en `http://localhost:5173` con proxy a la API en `:3000`.

| Pantalla | Ruta |
|----------|------|
| Home | `/` |
| Login | `/login` (pegar JWT manualmente) |
| Dashboard | `/dashboard` |
| Incident Details | `/incidents/:incidentId` |

Ver `frontend/README.md` y `docs/architecture_reviews/sprint_18_frontend_foundation.md`.

---

## Variables de entorno

Copiar `.env.example` a `.env`:

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `DATABASE_URL` | Conexión PostgreSQL | `postgresql://edificios:edificios@localhost:5432/edificios` |
| `EVIDENCE_STORAGE_PATH` | Directorio de archivos físicos de Evidence | `./storage/evidences` |

---

## Base de datos

### Levantar PostgreSQL

```bash
npm run db:up
```

Usa Docker Compose con PostgreSQL 16. Credenciales definidas en `docker-compose.yml`.

### Aplicar migraciones

```bash
npm run db:migrate
```

Ejecuta en orden los archivos SQL de `src/operations/infrastructure/migrations/`:

| Archivo | Tablas |
|---------|--------|
| `001_initial.sql` | `incidents`, `events`, `outbox` |
| `002_evidences.sql` | `evidences` |
| `003_event_evidences.sql` | `event_evidences` |

Las migraciones están pensadas para una base vacía. Si necesitás reiniciar:

```bash
npm run db:reset
npm run db:migrate
```

### Setup completo en un paso

```bash
npm run db:setup
```

Levanta PostgreSQL, espera a que esté listo y aplica migraciones.

---

## Tests

```bash
npm test
```

Los tests de integración usan mocks de PostgreSQL y no requieren base de datos en ejecución. Estado actual: **621/621 OK** (63 suites).

| Suite | Qué verifica |
|-------|--------------|
| `evidence.spec.ts` | Dominio Evidence y Value Objects |
| `incident-lifecycle.integration.spec.ts` | Ciclo de vida Incident |
| `capture-evidence.integration.spec.ts` | CaptureEvidenceUseCase |
| `capture-evidence.http.integration.spec.ts` | Endpoint multipart HTTP |
| `postgres-*.integration.spec.ts` | Repositorios PostgreSQL (mock) |

---

## Aplicación

```bash
# Desarrollo con recarga
npm run start:dev

# Producción local
npm run build
npm run start
```

Puerto: **3000** (configurado en `src/main.ts`).

---

## Endpoints HTTP

### Incident Lifecycle

| Método | Ruta | Body |
|--------|------|------|
| `POST` | `/api/v1/operations/incidents` | `{ "description": "..." }` |
| `POST` | `/api/v1/operations/incidents/:id/assign` | `{ "actorId": "..." }` |
| `POST` | `/api/v1/operations/incidents/:id/start` | — |
| `POST` | `/api/v1/operations/incidents/:id/resolve` | — |

### Evidence

| Método | Ruta | Body |
|--------|------|------|
| `POST` | `/api/v1/operations/events/:eventId/evidence` | `multipart/form-data`: `file`, `actorId`, `caption?` |

Respuesta Evidence: `201 Created` → `{ "evidenceId": "..." }`.

### Ejemplo: detectar incidencia

```bash
curl -X POST http://localhost:3000/api/v1/operations/incidents \
  -H "Content-Type: application/json" \
  -d "{\"description\":\"Olor a quemado en bomba principal.\"}"
```

### Ejemplo: capturar evidencia

```bash
curl -X POST http://localhost:3000/api/v1/operations/events/<eventId>/evidence \
  -F "file=@./test/fixtures/bomba-principal.jpg" \
  -F "actorId=00000000-0000-0000-0000-000000000001" \
  -F "caption=Olor a quemado en bomba principal."
```

---

## Estructura del proyecto

```
src/                  # Backend NestJS (monolito modular)
  operations/
  authentication/
  health/
  info/
  shared/
  config/
frontend/             # Cliente web React (Release Candidate)
test/                 # Tests de integración backend
docs/                 # Documentación del proyecto
```

---

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [docs/00_project_brief.md](docs/00_project_brief.md) | Qué es EdificiOS |
| [docs/01_architecture.md](docs/01_architecture.md) | Capas y persistencia |
| [docs/GUIA_USO.md](docs/GUIA_USO.md) | Guía de uso local (DB, API, frontend) |
| [docs/glossary.md](docs/glossary.md) | Lenguaje ubicuo (dominio + frontend) |
| [docs/05_current_status.md](docs/05_current_status.md) | Estado actual y backlog |
| [docs/06_rules.md](docs/06_rules.md) | Reglas de ingeniería |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Historial de cambios |
| [docs/architecture_decisions/](docs/architecture_decisions/) | ADRs |
| [docs/field_stories/](docs/field_stories/) | Historias de campo |
| [AGENTS.md](AGENTS.md) | Constitución para agentes de IA |

---

## Arquitectura (resumen)

- **Monolito modular** con Clean Architecture.
- **Event Log** como fuente de verdad (append-only).
- **Transactional Outbox** para publicación futura de eventos.
- **Dominio puro**: sin NestJS, sin PostgreSQL, sin filesystem.
- **Evidence** respalda **Domain Events**, no Incident directamente (tabla puente `event_evidences`).

Antes de proponer cambios, leer `AGENTS.md` y `docs/AI_CONTEXT.md`.

---

## Scripts npm

| Script | Descripción |
|--------|-------------|
| `npm run build` | Compila TypeScript |
| `npm test` | Ejecuta todos los tests |
| `npm run start` | Inicia la aplicación |
| `npm run start:dev` | Inicia con recarga en caliente |
| `npm run db:up` | Levanta PostgreSQL (Docker) |
| `npm run db:down` | Detiene PostgreSQL |
| `npm run db:reset` | Elimina volumen y recrea PostgreSQL |
| `npm run db:migrate` | Aplica migraciones SQL |
| `npm run db:setup` | `db:up` + espera + `db:migrate` |
