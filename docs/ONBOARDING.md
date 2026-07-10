npm install
cp .env.example .env          # Copy-Item en PowerShell
npm run db:setup              # PostgreSQL + migraciones
npm run build && npm test     # 66/66 OK
# Exportar variables de .env (ver README)
npm run start:dev             # http://localhost:3000

-------------------------------------------------------------------------## Revisión de onboarding completada

Se corrigieron los huecos que impedían levantar el proyecto sin contexto previo. Sin cambios en dominio ni arquitectura.

### Problemas detectados y corregidos

| Problema | Corrección |
|----------|------------|
| No existía `README.md` usable (archivo corrupto) | `README.md` nuevo con guía completa |
| Sin `docker-compose.yml` | PostgreSQL 16 con healthcheck |
| Sin script de migraciones | `scripts/migrate.js` + `scripts/wait-for-postgres.js` |
| Sin scripts npm de DB | `db:up`, `db:down`, `db:reset`, `db:migrate`, `db:setup` |
| Sin `.env.example` | Variables documentadas |
| NestJS no carga `.env` | Documentado con comandos bash y PowerShell |
| `docs/AI_CONTEXT.md` con rutas incorrectas | Corregidas (`03_glossary`, `06_rules`, `05_current_status`) |
| `05_current_status.md` duplicado y desactualizado | Reescrito como fuente única de verdad |
| `CHANGELOG.md` con features futuras | Limpiado; solo Sprint 0, 1 y 2 |

### Archivos creados o actualizados

- `README.md` — onboarding de punta a punta
- `docker-compose.yml`
- `.env.example`
- `scripts/migrate.js` (lee `.env` sin dependencias extra)
- `scripts/wait-for-postgres.js`
- `package.json` — scripts de base de datos
- `docs/CHANGELOG.md`
- `docs/05_current_status.md`
- `docs/AI_CONTEXT.md`
- `.gitignore` — agregado `.env`

### Flujo para un desarrollador nuevo

```bash
npm install
cp .env.example .env          # Copy-Item en PowerShell
npm run db:setup              # PostgreSQL + migraciones
npm run build && npm test     # 66/66 OK
# Exportar variables de .env (ver README)
npm run start:dev             # http://localhost:3000
```

### Estado documentado

- **Sprint 0, 1 y 2:** completados
- **Tests:** 66/66
- **Tablas:** `incidents`, `events`, `outbox`, `evidences`, `event_evidences`
- **Backlog Sprint 3:** P1 técnico (sin features futuras en CHANGELOG)