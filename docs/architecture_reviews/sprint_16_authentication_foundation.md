# Architecture Review — Sprint 16: Authentication Foundation

**Objetivo:** construir la infraestructura del bounded context Authentication (query, command, contexto de identidad) **sin implementar autenticación real**.  
**Alcance revisado:** PR1–PR5 (Query Model, HTTP Query API, Create User, Current User + AuthenticationContext, documentación).

---

## Veredicto

**Sprint 16 es aprobable sin correcciones P0.**

El sistema gana un módulo `authentication` autocontenido, independiente de Operations, con CQRS ligero (lectura/escritura separadas), APIs HTTP y un puerto `AuthenticationContext` listo para JWT en Sprint 17.

**Sprint 16 NO implementa autenticación real.** No hay JWT, login, passwords, guards ni autorización. Solo la infraestructura necesaria para incorporarlos sin refactor estructural.

---

## Objetivo

1. **Query Model** — `AuthenticatedUserView`, `UserQueryRepository`, `GetAuthenticatedUserUseCase`
2. **HTTP Query API** — `GET /api/v1/authentication/users/:id`
3. **Command Model** — `UserRecord`, `UserPersistence`, `CreateUserUseCase`
4. **HTTP Command API** — `POST /api/v1/authentication/users`
5. **Authentication Context** — puerto + stub + `GET /api/v1/authentication/me`

Sin modificar dominio de Operations, agregados existentes, Shared, Health, Info ni Swagger.

---

## Arquitectura

### Estructura Authentication

```
src/authentication/
├── application/
│   ├── authenticated-user-view.ts
│   ├── user-query-persistence.ts       ← puerto lectura
│   ├── user-persistence.ts             ← puerto escritura
│   ├── get-authenticated-user-use-case.ts
│   ├── create-user-use-case.ts
│   ├── get-current-user-use-case.ts
│   ├── authentication-context.ts       ← puerto identidad
│   └── map-authenticated-user-view.ts
├── infrastructure/
│   ├── http/
│   │   ├── authenticated-user.controller.ts
│   │   ├── get-authenticated-user-params.pipe.ts
│   │   ├── create-user-request.pipe.ts
│   │   └── stub-authentication-context.ts
│   └── persistence/
│       ├── postgres-user-query-repository.ts
│       ├── postgres-user-repository.ts
│       ├── postgres-authentication-pool.ts
│       └── migrations/001_users.sql
└── authentication.module.ts
```

`AuthenticationModule` es **completamente autocontenido**: pool propio, sin importar `OperationsModule`.

### Flujo general

```
HTTP
    ↓
AuthenticationContext (Stub en Sprint 16)
    ↓
Use Cases
    ↓
Repositories (Query / Command)
    ↓
PostgreSQL (users)
```

---

## CQRS aplicado

| Lado | Puerto | Implementación | Use Case | HTTP |
|------|--------|----------------|----------|------|
| **Query** | `UserQueryRepository` | `PostgresUserQueryRepository` | `GetAuthenticatedUserUseCase` | `GET /users/:id` |
| **Command** | `UserPersistence` | `PostgresUserRepository` | `CreateUserUseCase` | `POST /users` |
| **Current User** | `AuthenticationContext` + Query | Stub + `GetAuthenticatedUserUseCase` | `GetCurrentUserUseCase` | `GET /me` |

Misma tabla `users`, repositorios separados. Sin agregados de dominio; `UserRecord` en Application (patrón Notification Query / Health).

---

## Separación Query / Command

- **Query:** solo lectura; `findById` → `AuthenticatedUserView`.
- **Command:** solo escritura; `create(UserRecord)` → `void`.
- **Sin sharing de repositorio:** cada lado evoluciona independientemente (password hash en command futuro sin tocar query).

---

## AuthenticationContext

| Aspecto | Sprint 16 | Sprint 17 (previsto) |
|---------|-----------|----------------------|
| Interfaz | `getCurrentUserId(): string \| null` | Sin cambio |
| Implementación | `StubAuthenticationContext` | JWT-based provider |
| Fuente de identidad | UUID fijo hardcodeado | Claim del token Bearer |
| Use cases | `GetCurrentUserUseCase` sin cambios | Sin cambios |
| Controllers | `GET /me` sin cambios | Sin cambios |
| Wiring | `AUTHENTICATION_CONTEXT` token en module | Swap de provider |

El stub **no lee** headers, request ni JWT. Es deliberadamente simple para validar la arquitectura.

---

## Preparación para JWT

Sprint 17 podrá:

1. Crear `JwtAuthenticationContext implements AuthenticationContext`
2. Registrar en `AuthenticationModule`: `{ provide: AUTHENTICATION_CONTEXT, useClass: JwtAuthenticationContext }`
3. Eliminar o desactivar `StubAuthenticationContext`

**Sin tocar:** `GetCurrentUserUseCase`, `AuthenticatedUserController`, query/command use cases.

OpenAPI ya declara esquema Bearer (Sprint 15); runtime JWT conectará con este puerto.

---

## Decisiones

| Decisión | Razón |
|----------|-------|
| Bounded context independiente | Authentication no pertenece a Operations; Actor ≠ User |
| Sin agregado User | MVP field-first; CRUD + query como Notification/Health |
| Stub en lugar de JWT en Sprint 16 | Separar infraestructura de mecanismo criptográfico |
| `UnauthorizedException` en `GetCurrentUserUseCase` | Semántica HTTP clara para `/me` sin guards aún |
| Pool PostgreSQL propio | Mismo `DATABASE_URL`; módulo desacoplado de `PostgresOperationsPool` |
| Status `ACTIVE` por defecto en create | Usuario operativo desde registro; sin transiciones en MVP |
| Sin validación RFC de email | Deuda consciente; Sprint posterior |

---

## Trade-offs

| Trade-off | Decisión | Alternativa descartada |
|-----------|----------|------------------------|
| Stub fijo vs mock por entorno | UUID constante | Header `X-User-Id` (acopla HTTP al contexto) |
| Use case lanza `UnauthorizedException` | Pragmático para `/me` | Error de dominio + mapper (overhead sin agregado) |
| Tabla `users` sin `password` | Sprint 16 solo identidad | Columna nullable (prematuro) |
| Dos repositorios sobre misma tabla | CQRS ligero explícito | Repositorio único read/write (mezcla responsabilidades) |
| Sin Swagger update | Alcance acotado | Documentar endpoints auth (PR futuro) |

---

## Deuda futura

Ítems P2 en `docs/architecture_backlog.md` (sección Sprint 16):

- JWT Authentication
- Password Hashing
- Login endpoint
- Refresh Tokens
- Authorization (Roles/Permissions)
- Session Revocation

Ítems resueltos en este sprint (sección Resueltos):

- Authentication Query API
- Create User
- Authentication Context (stub)

---

## Conclusión

Sprint 16 establece el **cimiento de identidad** de EdificiOS: un bounded context Authentication con CQRS, APIs HTTP y un puerto de contexto intercambiable.

No hay autenticación real todavía — y eso es correcto para este sprint. La arquitectura está diseñada para que Sprint 17 agregue JWT como un cambio de infraestructura, no como un refactor transversal.

**Versión:** `0.16.0-alpha`  
**Tests:** 603/603 OK · 61 test suites · Build OK
