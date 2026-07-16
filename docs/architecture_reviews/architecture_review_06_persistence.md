# Architecture Review 06 — Persistence

**Versión:** post `0.18.0-alpha`  
**Fecha:** 2026-07-15  
**Alcance:** repositories, pools, SQL, migrations, mappers, outbox  
**Restricción:** sin cambiar esquema, sin migraciones, sin alterar comportamiento de consultas.

---

## Objetivo

Auditar la capa de persistencia en busca de SQL repetido, mappers duplicados, pools duplicados, imports innecesarios, código muerto y mejoras de mantenibilidad.

---

## Análisis

### Pools

| Clase | BC | Config |
|-------|-----|--------|
| `PostgresOperationsPool` | Operations | `DATABASE_URL` |
| `PostgresAuthenticationPool` | Authentication | `DATABASE_URL` |

Configuración idéntica; tokens DI separados. **Corregido** vía `shared/persistence/postgres-pool-factory.ts` (AR04/AR06).

### Repositories Operations (18)

| Tipo | Archivos |
|------|----------|
| Command (CRUD agregado) | actor, asset, site, shift, evidence, incident, work-order, notification, flow-event, outbox (write) |
| Query (read model) | incident-query, incident-timeline, evidence-query, event-query, event-evidence, work-order-query, notification-query |
| Transaccional | `postgres-operations-transaction-runner` — compone repos con `PoolClient` |

### Repositories Authentication (2)

- `PostgresUserRepository`, `PostgresUserQueryRepository`

### Outbox BC (1)

- `PostgresOutboxDispatchRepository` — lectura/dispatch; usa `PostgresOperationsPool`

### Migrations

11 archivos SQL en `operations/infrastructure/migrations/`. Sin cambios en esta review.

---

## Hallazgos

### 1. Pool config duplicada (corregido)

Ver AR04 — factory compartida; instancias Pool separadas preservadas.

### 2. Patrón `findById` repetido (documentado, no corregido)

10+ repositorios siguen el patrón:

```sql
SELECT ... FROM table WHERE id = $1
-- if rowCount === 0 → null
-- else toRecord(row)
```

Extraer base class o helper genérico implicaría abstracción nueva no solicitada. Cada mapper `toXRecord()` tiene columnas distintas — duplicación estructural aceptada.

### 3. Sin mappers duplicados entre repositorios

Cada `toRecord()` es específico de su tabla. No hay copias byte-a-byte entre archivos.

### 4. Sin SQL duplicado crítico

Consultas similares (`ORDER BY name`, `WHERE site_id = $1`) reflejan queries distintas por agregado — no son el mismo SQL copiado.

### 5. Outbox write vs dispatch (documentado)

| Rol | Ubicación | Tabla |
|-----|-----------|-------|
| Write (INSERT) | `operations/.../postgres-outbox-repository.ts` | `outbox` |
| Dispatch (SELECT/UPDATE) | `outbox/.../postgres-outbox-dispatch-repository.ts` | `outbox` |

Complementarios; no duplicación — responsabilidades distintas (transactional write vs async consumer).

### 6. Sin código muerto en persistencia

- `PostgresFlowEventRepository` — usado por transaction runner.
- `PostgresIncidentRepository` — usado por transaction runner y tests.
- `user-query-row.ts` — usado por user query repository.

### 7. `operator_id` en DB vs `actorId` en dominio (documentado P2)

Mapeo en infraestructura Shift; sin cambio en esta review.

---

## Cambios realizados

| Archivo | Cambio |
|---------|--------|
| `shared/persistence/postgres-pool-factory.ts` | **Creado** — factory de configuración Pool |
| `postgres-operations-pool.ts` | Usa `createPostgresPool()` |
| `postgres-authentication-pool.ts` | Usa `createPostgresPool()` |

---

## Decisiones

- **No unificar pools en un solo provider:** preserva límites BC y comportamiento de conexiones actual.
- **No extraer base repository:** evita abstracción prematura; repositorios son thin adapters deliberados.
- **No tocar migrations ni SQL:** cero riesgo de regresión en consultas.

---

## Trade-offs

| Decisión | Beneficio | Coste |
|----------|-----------|-------|
| Factory compartida | Config DRY | Dos pools activos (mismo que antes) |
| Repositories explícitos | Legibilidad por agregado | Patrón findById repetido |

---

## Deuda remanente

- Dos instancias `Pool` hacia la misma `DATABASE_URL` — candidato a `DatabaseModule` único (P2).
- Patrón `findById` + `toRecord` repetido — candidato a helper genérico cuando escala lo justifique.
- Columna `operator_id` vs `actorId` — migración futura.
- Sin FK en PostgreSQL — deuda P1 existente (integridad en Application).

---

## Conclusión

La capa de persistencia está estructurada por agregado sin mappers duplicados ni código muerto. La única duplicación real corregida fue la configuración de Pool. El resto de repetición es patrón estructural aceptado en el MVP; alterarlo introduciría abstracciones no solicitadas.
