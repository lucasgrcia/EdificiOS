# Release Checklist — EdificiOS `0.18.0-alpha`

Lista de verificación para confirmar que el Release Candidate está listo para **demostración**, **evaluación** o **etiquetado** (`0.18.0-alpha`).

Usar antes de una presentación importante, un handoff a otro equipo o un tag en el repositorio.

---

## 1. Entorno y dependencias

- [ ] Node.js 20.x instalado (`node -v`)
- [ ] npm 10.x instalado (`npm -v`)
- [ ] Docker instalado y en ejecución
- [ ] Repositorio clonado en estado limpio (sin cambios locales no commiteados, si aplica)
- [ ] `.env` creado desde `.env.example`
- [ ] `DATABASE_URL` apunta a PostgreSQL local
- [ ] `EVIDENCE_STORAGE_PATH` definido (`./storage/evidences`)

---

## 2. Docker y base de datos

- [ ] `npm run db:up` — contenedor PostgreSQL 16 activo
- [ ] `docker ps` muestra `postgres:16-alpine` healthy
- [ ] `npm run db:migrate` — migraciones aplicadas sin error
- [ ] Health check: `GET http://localhost:3000/api/v1/health` → `"database": "UP"`

### Comandos de referencia

```bash
npm run db:up        # Levantar PostgreSQL
npm run db:migrate   # Aplicar migraciones SQL
npm run db:setup     # up + wait + migrate (primera vez)
npm run db:reset     # Destruir volumen y recrear (solo dev)
npm run db:down      # Detener PostgreSQL
```

---

## 3. Backend

- [ ] Variables de `.env` exportadas en la terminal del backend (NestJS no carga `.env` solo)
- [ ] `npm run build` — compilación sin errores
- [ ] `npm test` — **70 suites / 658 tests** en verde
- [ ] `npm run start:dev` — API en `http://localhost:3000`
- [ ] `GET /api/v1/info` → `"version": "0.18.0-alpha"`
- [ ] `GET /api/v1/health` → `"status": "UP"`

### Swagger

- [ ] `http://localhost:3000/api/docs` — UI accesible
- [ ] `http://localhost:3000/api/docs-json` — OpenAPI JSON disponible
- [ ] Endpoints `/operations/*` documentados con seguridad Bearer
- [ ] `POST /api/v1/authentication/login` operativo

---

## 4. Frontend

- [ ] `cd frontend && npm install` — dependencias OK
- [ ] `npm run build` — TypeScript + Vite sin errores
- [ ] `npm test` — **14 suites / 40 tests** en verde
- [ ] `npm run dev` — cliente en `http://localhost:5173`
- [ ] Proxy `/api` → `:3000` funcional (Home muestra versión y backend disponible)

---

## 5. Datos de demostración (bootstrap)

Ejecutar **una vez** por entorno vacío:

- [ ] Usuario `demo@edificios.local` creado (`POST /authentication/users`)
- [ ] Site creado
- [ ] Asset creado (con `siteId`)
- [ ] Actor creado (con `siteId`)
- [ ] Shift iniciado (`POST .../shifts/start`)
- [ ] Al menos una incidencia detectada (`POST /operations/incidents`)

Ver paso a paso en [DEMO.md](DEMO.md) — sección *Preparación*.

---

## 6. Flujo completo (interfaz web)

Recorrido sin Swagger ni Postman:

- [ ] **Home** (`/`) — versión + backend disponible + CTA correcto según sesión
- [ ] **Login** (`/login`) — `demo@edificios.local` → Dashboard
- [ ] **Dashboard** — métricas, incidencias recientes, activity feed
- [ ] **Incidencia** — detalle desde dashboard o feed
- [ ] **Timeline** — visible en detalle; enlace “Ver timeline ↓” funciona
- [ ] **Volver al Dashboard** — enlaces de retorno operativos
- [ ] **Incidencias** (`/incidents`) — listado desde caché del dashboard
- [ ] **Home con sesión** — CTA “Ir al Dashboard”
- [ ] **Logout** — limpia sesión y redirige a login
- [ ] **ProtectedRoute** — `/dashboard` sin sesión redirige a login
- [ ] **Sesión persistente** — recargar página con token válido restaura sesión
- [ ] **401 global** — token inválido cierra sesión con toast (verificar opcional)

Guión detallado: [DEMO.md](DEMO.md).

---

## 7. Coherencia de versión

- [ ] `package.json` (raíz) → `"version": "0.18.0-alpha"`
- [ ] `frontend/package.json` → `"version": "0.18.0-alpha"`
- [ ] `GET /api/v1/info` → `version: "0.18.0-alpha"`
- [ ] Swagger UI muestra la misma versión
- [ ] `docs/CHANGELOG.md` incluye entrada `[0.18.0-alpha]`

---

## 8. Documentación

- [ ] [README.md](../README.md) — punto de entrada único actualizado
- [ ] [DEMO.md](DEMO.md) — guía de presentación 10–15 min
- [ ] [GUIA_USO.md](GUIA_USO.md) — guía operativa local
- [ ] [05_current_status.md](05_current_status.md) — estado del proyecto
- [ ] [architecture_backlog.md](architecture_backlog.md) — deuda priorizada
- [ ] [CHANGELOG.md](CHANGELOG.md) — historial de cambios

---

## 9. Known limitations revisadas

Confirmar que las limitaciones siguientes están **documentadas** y **aceptadas** para `0.18.0-alpha`:

- [ ] Sin roles, permisos ni refresh tokens ([backlog P2 — Authentication](architecture_backlog.md))
- [ ] UI de solo lectura para incidencias (detect/assign/resolve solo vía API)
- [ ] `/authentication/me` sin `actorId` en respuesta (dashboard funciona; selector de actor pendiente)
- [ ] Acoplamiento Operations → Authentication en guards HTTP ([AR03](architecture_reviews/architecture_review_03_bounded_contexts.md))
- [ ] `ActorId` dual en dominio ([AR01](architecture_reviews/architecture_review_01_value_objects.md))
- [ ] Sin tests E2E Playwright/Cypress (Vitest unit/integration frontend únicamente)
- [ ] API URL de producción no configurable en build frontend (proxy solo en dev)

Lista completa: [README.md](../README.md) — sección *Known Limitations*.

---

## 10. Criterio de aprobación

El Release Candidate **`0.18.0-alpha`** se considera **aprobado** cuando:

| Área | Criterio |
|------|----------|
| Docker + DB | PostgreSQL healthy, migraciones aplicadas |
| Backend | Build OK, 658/658 tests, health UP |
| Frontend | Build OK, 40/40 tests, proxy OK |
| Swagger | Accesible y coherente con contratos |
| Demo web | Flujo completo de [DEMO.md](DEMO.md) sin herramientas externas |
| Documentación | README + DEMO + checklist + backlog actualizados |

**No requisito para RC:** despliegue en producción, CI/CD, métricas Prometheus, E2E browser automation.

---

## 11. Post-release (futuro `1.0`)

Ítems que **no** bloquean `0.18.0-alpha` pero deben planificarse antes de `1.0`:

1. Resolver ítems **P1** del [architecture_backlog.md](architecture_backlog.md) (Event Log incompleto, concurrencia, mapeo HTTP, etc.)
2. Hardening de seguridad: refresh tokens, políticas de autorización
3. Cobertura E2E del flujo demo
4. Despliegue con URL de API configurable
5. Observabilidad exportable (Prometheus / OpenTelemetry)

---

**Versión objetivo:** `0.18.0-alpha`  
**Última actualización:** 2026-07-15 (Sprint 19 — cierre)
