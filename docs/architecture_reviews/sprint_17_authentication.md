# Architecture Review — Sprint 17: JWT Authentication

**Objetivo:** completar autenticación JWT en el bounded context Authentication — validación de tokens, protección HTTP y documentación OpenAPI — **sin implementar autorización, login ni emisión de tokens**.  
**Alcance revisado:** PR1–PR5 (JWTAuthenticationContext, reemplazo del stub, JwtAuthenticationGuard, Swagger Bearer, documentación).

---

## Veredicto

**Sprint 17 es aprobable sin correcciones P0.**

El sistema pasa de infraestructura de identidad (Sprint 16) a **autenticación JWT operativa** en `GET /api/v1/authentication/me`, manteniendo el contrato de `AuthenticationContext` y sin modificar use cases de Application.

**Sprint 17 NO implementa autorización.** No hay roles, permisos, login, passwords ni emisión de JWT. Solo validación de tokens existentes y protección documentada del endpoint de usuario actual.

---

## Objetivo

1. **JWTAuthenticationContext** — sustituir `StubAuthenticationContext`; validar Bearer JWT y extraer `userId`
2. **Configuración JWT** — `ApplicationConfig` como único origen (`jwtSecret`, `jwtIssuer`, `jwtAudience`, `jwtExpiration`)
3. **JwtAuthenticationGuard** — exigir identidad en `GET /me` vía `AuthenticationContext`
4. **Swagger Bearer** — documentar esquema y marcar `/me` como protegido
5. **Documentación** — cerrar sprint en CHANGELOG, status, glosario y backlog

---

## Arquitectura

### Estructura relevante (post Sprint 17)

```
src/authentication/
├── application/
│   ├── authentication-context.ts          ← puerto (sin cambios)
│   ├── get-current-user-use-case.ts       ← sin cambios funcionales
│   └── ...
├── infrastructure/
│   ├── http/
│   │   ├── jwt-authentication-context.ts  ← valida JWT
│   │   ├── jwt-authentication.guard.ts    ← exige identidad HTTP
│   │   ├── authentication-http-context.ts
│   │   ├── authentication-context.middleware.ts
│   │   └── authenticated-user.controller.ts  ← @UseGuards solo en /me
│   └── jwt/
│       └── authentication-jwt.module.ts   ← @nestjs/jwt
└── authentication.module.ts
```

### Separación Application / Infrastructure

| Capa | Componente | Responsabilidad |
|------|------------|-----------------|
| **Application** | `AuthenticationContext` | Contrato `getCurrentUserId(): string \| null` |
| **Application** | `GetCurrentUserUseCase` | Orquestar contexto + query; 401 si `null` o usuario inexistente |
| **Infrastructure** | `JWTAuthenticationContext` | Parsear Bearer, validar JWT, extraer claim; **nunca lanza** |
| **Infrastructure** | `JwtAuthenticationGuard` | Delegar al contexto; **lanza** `UnauthorizedException` si `null` |
| **Infrastructure** | `AuthenticationContextMiddleware` | Propagar header `Authorization` vía AsyncLocalStorage |

**Regla respetada:** Application no importa NestJS ni `@nestjs/jwt`. Toda criptografía y HTTP viven en Infrastructure.

---

## Flujo de autenticación

```
Cliente
  Authorization: Bearer <JWT>
       ↓
AuthenticationContextMiddleware
  → AuthenticationHttpContext.runWithAuthorization(header)
       ↓
GET /api/v1/authentication/me
       ↓
JwtAuthenticationGuard
  → AuthenticationContext.getCurrentUserId()
       ↓ (null → 401)
JWTAuthenticationContext
  → JwtService.verify(token) → claim userId
       ↓ (UUID)
GetCurrentUserUseCase
  → GetAuthenticatedUserUseCase.execute(userId)
       ↓
AuthenticatedUserView (200)
```

**Endpoints públicos (sin guard):**

- `POST /api/v1/authentication/users`
- `GET /api/v1/authentication/users/:id`
- Todos los endpoints de Operations, Health, Info, Swagger

---

## Decisiones tomadas

| Decisión | Razón |
|----------|-------|
| `AuthenticationContext` sin cambios de contrato | Sprint 16 preparó el puerto; Sprint 17 solo cambia implementación |
| Contexto devuelve `null`, guard lanza 401 | Separar validación técnica (infra) de rechazo HTTP (guard) |
| Guard depende solo del puerto | No acoplar guard a `JwtService`; un solo origen de identidad |
| AsyncLocalStorage para el header | Mismo patrón que `CorrelationIdProvider`; controller singleton |
| Proteger solo `GET /me` | MVP: identidad del usuario actual; Operations sigue público |
| JWT configurable en `ApplicationConfig` | Sin hardcode; preparado para variables de entorno futuras |
| OpenAPI: solo `/me` con `security: bearer` | Documentación fiel al runtime; endpoints públicos con `security: []` |
| Sin emisión de tokens en la API | Tokens provienen de fuente externa hasta implementar login |

---

## Ventajas

- **Swap sin refactor:** sustituir stub por JWT no tocó use cases ni lógica de controller
- **Testabilidad:** contexto, guard y Swagger verificados con tests de integración independientes
- **Clean Architecture:** Application define *quién* es el usuario; Infrastructure define *cómo* se obtiene del HTTP/JWT
- **OpenAPI alineado:** clientes ven claramente qué endpoint requiere Bearer
- **Extensibilidad:** nuevos endpoints protegidos = `@UseGuards(JwtAuthenticationGuard)` sin tocar contexto

---

## Trade-offs

| Trade-off | Decisión | Alternativa descartada |
|-----------|----------|------------------------|
| Guard vs validación solo en use case | Guard en HTTP | Use case lanzando 401 sin guard (menos explícito en borde HTTP) |
| Contexto retorna `null` vs lanza | `null` en contexto, excepción en guard | `UnauthorizedException` en contexto (mezcla infra con semántica HTTP) |
| ALS vs REQUEST scope | Middleware + AsyncLocalStorage | REQUEST scope en controller/use case (cambio de wiring transversal) |
| Solo `/me` protegido | Alcance MVP | Proteger Operations (requiere autorización, fuera de sprint) |
| Sin login/emisión JWT | Validación only | Endpoint de login prematuro sin password hashing |

---

## Deuda pendiente

Ítems P2 en `docs/architecture_backlog.md` (sección Sprint 17):

- Refresh Tokens
- Password Hashing
- Login Credentials
- Roles
- Permissions
- Authorization Policies

Ítems resueltos en este sprint:

- Stub Authentication
- JWT Authentication (validación runtime)

---

## Conclusión

Sprint 17 cierra el arco de autenticación iniciado en Sprint 16: el bounded context Authentication valida JWT en runtime, protege `GET /me` en HTTP y documenta el contrato Bearer en OpenAPI.

La autorización (roles, permisos, políticas) queda explícitamente fuera de alcance. El siguiente paso natural es un flujo de credenciales (login + password hashing + emisión de tokens) sin refactor de la arquitectura actual.

**Versión:** `0.17.0-alpha`  
**Tests:** 621/621 OK · 63 test suites · Build OK
