# Architecture Review 03 — Acoplamiento entre Bounded Contexts

**Versión:** post `0.18.0-alpha`  
**Fecha:** 2026-07-15  
**Alcance:** `operations`, `authentication`, `outbox`, `frontend`, `shared`, `health`  
**Restricción:** refactor solo con puertos existentes; sin arquitectura nueva.

---

## Objetivo

Verificar que los bounded contexts respeten límites de conocimiento:

| Contexto | No debe conocer |
|----------|-----------------|
| Operations | Authentication, Outbox, Frontend |
| Authentication | Operations |
| Outbox | Domain (operations) |
| Frontend | Solo HTTP |

Buscar imports indebidos, dependencias circulares, acoplamientos ocultos y violaciones Clean Architecture.

---

## Análisis

### Grafo de imports entre paquetes de primer nivel

```
app
 ├── operations ──imports──► authentication (module + guard en HTTP)
 ├── authentication
 ├── outbox ──imports──► operations (PostgresOperationsPool)
 ├── health ──imports──► operations (PostgresOperationsPool)
 ├── shared ──imports──► authentication DTOs, operations DTOs (Swagger)
 └── frontend/ ──► solo src/api/*.ts (HTTP)
```

No hay dependencia circular entre módulos NestJS: `AuthenticationModule` no importa `OperationsModule`.

### Capas dentro de Operations

| Capa | Importa Authentication/Outbox BC |
|------|----------------------------------|
| `domain/` | No |
| `application/` | No (usa `OutboxRecord` propio — write-side interno) |
| `infrastructure/http/` | Sí — `JwtAuthenticationGuard` (12 controladores) |
| `infrastructure/persistence/` | No — `PostgresOutboxRepository` es persistencia local del write-side |

### Outbox bounded context

- `application/` — TypeScript puro; sin imports de `operations/domain`.
- `infrastructure/` — `PostgresOutboxDispatchRepository` usa pool de Operations (infra compartida), no dominio.

### Frontend

20 archivos TypeScript bajo `frontend/src/`. Todos los accesos al backend pasan por `api/client.ts`, `auth.api.ts`, `incident.api.ts`, `dashboard.api.ts`, `info.api.ts`. Sin imports de `src/operations` ni `src/authentication` del monorepo backend.

### Shared / Swagger

`shared/http/swagger/` importa DTOs de Authentication y Operations para OpenAPI. Es capa de documentación transversal, no bounded context operativo. Aceptado en MVP.

---

## Hallazgos

### 1. Operations conoce Authentication (no corregido)

**Evidencia:**

- `operations.module.ts` — `imports: [AuthenticationModule]`
- 12 controladores — `import { JwtAuthenticationGuard } from '../../../authentication/infrastructure/...'`

**Naturaleza:** acoplamiento de infraestructura HTTP introducido en RC Hardening PR4 para proteger endpoints Operations con JWT.

**Por qué no se refactorizó:** no existe un puerto de aplicación para “protección HTTP”. `AUTHENTICATION_CONTEXT` resuelve identidad en request, no autorización declarativa en controladores. Mover el guard a `shared` sería nueva superficie transversal no solicitada. Extraer un puerto implicaría contrato nuevo (fuera de alcance).

### 2. Operations write-side Outbox vs Outbox BC (documentado, no violación)

Operations persiste filas en tabla `outbox` vía `OutboxRepository` / `PostgresOutboxRepository` (application + infrastructure local). El bounded context `outbox/` consume esas filas con el dispatcher. Son roles complementarios (write / read-dispatch), no import de dominio cruzado.

### 3. Outbox importa OperationsModule (aceptable)

Solo para `PostgresOperationsPool` — recurso de infraestructura PostgreSQL. No importa agregados, casos de uso ni dominio de Operations.

### 4. Authentication aislado de Operations (cumple)

Ningún archivo bajo `src/authentication/` importa `operations`.

### 5. Outbox aislado de Domain (cumple)

Ningún archivo bajo `src/outbox/` importa `operations/domain`.

### 6. Frontend solo HTTP (cumple)

Sin acoplamiento al código backend del monorepo.

### 7. Sin dependencias circulares

Verificado en grafo de módulos y en imports TypeScript cross-context.

---

## Cambios realizados

Ningún refactor de acoplamiento en esta review — las violaciones detectadas requieren decisión arquitectónica (guard transversal vs puerto de autorización) fuera del alcance incremental post-RC.

Documentación actualizada en backlog y reviews para trazabilidad.

---

## Decisiones

- **JWT en Operations:** aceptado como deuda consciente P2 hasta que exista estrategia de autorización cross-cutting (ADR o Field Story).
- **Pool compartido:** `PostgresOperationsPool` exportado desde Operations es el mecanismo existente para Health y Outbox; no se creó módulo `DatabaseModule` nuevo.
- **Swagger en shared:** no se tocó — no altera runtime ni contratos HTTP.

---

## Trade-offs

| Opción | Pro | Contra |
|--------|-----|--------|
| Mantener guard en Authentication | RC estable, tests verdes | Operations infringe límite BC |
| Mover guard a shared | Desacopla BCs | Nueva dependencia transversal; fuera de alcance |
| APP_GUARD global | Un solo wiring | Cambiaría qué rutas son públicas — riesgo de comportamiento |

---

## Deuda remanente

| Ítem | Prioridad | Dirección mínima futura |
|------|-----------|-------------------------|
| Operations → Authentication (HTTP) | P2 | ADR: guard en `shared/http/security` o contrato de autorización sin importar BC Authentication desde Operations |
| Swagger shared → DTOs multi-BC | P2 | Paquete `api-contracts` o generación OpenAPI desacoplada |
| `operations.module.ts` importa AuthenticationModule | P2 | Mismo ADR que guard |

---

## Conclusión

El sistema cumple aislamiento en **dominio** y **application** entre Operations, Authentication y Outbox. La única violación estructural relevante es **Operations infrastructure → Authentication infrastructure** por JWT, heredada del RC y documentada como deuda. Frontend y capa de dominio Outbox están correctamente acotados. No se introdujo arquitectura nueva; estabilidad y tests intactos.
