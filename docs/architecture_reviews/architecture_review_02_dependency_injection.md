# Architecture Review 02 — Dependency Injection

**Versión:** post `0.18.0-alpha`  
**Fecha:** 2026-07-15  
**Alcance:** módulos NestJS (`app`, `operations`, `authentication`, `outbox`, `health`, `info`, `shared`, `config`)  
**Restricción:** eliminar solo redundancias reales; sin cambio de comportamiento ni contratos públicos HTTP.

---

## Objetivo

Auditar el wiring NestJS en busca de providers duplicados, exports innecesarios, imports redundantes, tokens duplicados y registro doble de dependencias.

---

## Análisis

Módulos auditados:

| Módulo | Imports | Exports | Observación inicial |
|--------|---------|---------|---------------------|
| `AppModule` | 7 módulos feature + shared | — | Orden correcto; sin providers duplicados |
| `SharedModule` | — (global) | 3 | Necesarios — consumidos por Operations |
| `ApplicationConfigModule` | — (global) | 1 | OK |
| `OperationsModule` | `AuthenticationModule` | `PostgresOperationsPool` | Provider duplicado detectado |
| `AuthenticationModule` | `AuthenticationJwtModule` | 5 tokens | 3 exports innecesarios |
| `OutboxModule` | `OperationsModule` | 2 tokens | Exports sin consumidores externos |
| `HealthModule` | `OperationsModule` | — | OK |
| `InfoModule` | `ApplicationConfigModule` | — | OK |

Patrones de factory (`useFactory` + `PostgresOperationsPool`) son repetitivos pero no redundantes — cada repositorio es instancia distinta.

Tokens `AUTHENTICATION_CONTEXT` y `OUTBOX_HANDLERS` — sin duplicación entre módulos.

---

## Hallazgos

### 1. Provider duplicado en `OperationsModule` (corregido)

`PostgresIncidentTimelineRepository` estaba registrado **dos veces** con el mismo `provide`, `inject` y `useFactory` (líneas 237–247). NestJS resolvía la misma instancia por token, pero el array de providers duplicaba configuración y dificultaba el mantenimiento.

### 2. Exports innecesarios en `AuthenticationModule` (corregido)

Exportados sin consumidor externo:

- `CreateUserUseCase`
- `GetAuthenticatedUserUseCase`
- `GetCurrentUserUseCase`

Solo se inyectan en controladores del mismo módulo. Los exports necesarios para Operations son:

- `JwtAuthenticationGuard`
- `AUTHENTICATION_CONTEXT`

### 3. Exports innecesarios en `OutboxModule` (corregido)

`OutboxDispatcher` y `PostgresOutboxDispatchRepository` se exportaban pero ningún módulo los importa. El runner y el processor viven dentro de `OutboxModule`.

### 4. Sin hallazgo — imports de módulo

- `OperationsModule` → `AuthenticationModule`: requerido para `JwtAuthenticationGuard` en controladores.
- `OutboxModule` / `HealthModule` → `OperationsModule`: requerido para `PostgresOperationsPool`.
- `AppModule` importa todos los feature modules una sola vez — sin redundancia.

### 5. Sin hallazgo — tokens duplicados

No hay `provide` con el mismo token en dos módulos exportados/importados de forma conflictiva.

---

## Cambios realizados

| Archivo | Cambio |
|---------|--------|
| `operations.module.ts` | Eliminado registro duplicado de `PostgresIncidentTimelineRepository` |
| `authentication.module.ts` | `exports` reducido a `JwtAuthenticationGuard`, `AUTHENTICATION_CONTEXT` |
| `outbox.module.ts` | Eliminada sección `exports` completa |

**Providers simplificados:** 6 (1 duplicado + 3 exports Authentication + 2 exports Outbox).

---

## Decisiones

- No extraer factories de repositorio a un helper compartido — repetición aceptable; unificar sería refactor cosmético fuera de alcance.
- No tocar `imports: [AuthenticationModule]` en Operations — necesario para DI del guard; ver AR3 para acoplamiento de bounded context.
- `PostgresOperationsPool` permanece exportado — consumido por Health y Outbox.

---

## Trade-offs

| Decisión | Beneficio | Coste |
|----------|-----------|-------|
| Quitar exports no usados | Superficie pública del módulo más honesta | Si un test futuro importara esos use cases desde otro módulo, habría que re-exportar |
| Mantener factories repetidas | Diff mínimo, cero riesgo | Verbosidad en `operations.module.ts` |

---

## Deuda remanente

- `operations.module.ts` ~700 líneas de providers — candidato a agrupación por agregado en sprint futuro (P2, no bloqueante).
- `OperationsModule` depende de `AuthenticationModule` a nivel Nest — acoplamiento documentado en AR3.

---

## Conclusión

Se corrigieron redundancias reales sin alterar el grafo de dependencias funcional. Tests (70 suites, 658 tests) y build permanecen verdes. El wiring restante refleja necesidades actuales del RC (JWT + pool compartido).
