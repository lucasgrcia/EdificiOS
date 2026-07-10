# ADR-007 — Site como agregado explícito

Estado:
Aceptado

Fecha:
2026-07-10

## Contexto

El edificio operaba como contexto implícito: `site_id` aparecía en `assets` y `shifts` sin un agregado `Site` que lo representara.

Las Field Stories describían el edificio en narrativa, pero el sistema no tenía un lugar único para registrar su identidad operativa (nombre, dirección, zona horaria, tipo).

## Decisión

1. **Site es un agregado raíz inmutable** con `register()` y `rehydrate()` únicamente. Sin Domain Events en este sprint.

2. **Todo Asset pertenece obligatoriamente a un Site existente.** La existencia se valida en Application (`RegisterAssetUseCase`) mediante `SiteRepository.findById()`, no en el dominio de Asset ni con Foreign Keys.

3. **Asset referencia Site por identidad** (`SiteId` VO importado desde `domain/site/`), no por composición. Site no conoce sus Assets.

4. **Integridad referencial sin FK:** la coherencia entre tablas `sites`, `assets` y `shifts` depende de casos de uso, no de restricciones PostgreSQL.

5. **Errores de dominio tipados:** `SiteNotFoundError` cuando el Site no existe al registrar un Asset. El adaptador HTTP traduce a `404 Not Found`.

## Consecuencias

### Beneficios

- El edificio deja de ser implícito; el lenguaje ubicuo **Site** tiene representación en código y persistencia.
- Asset queda anclado a un Site verificable en el flujo de registro.
- Consistencia con el patrón ya usado para Asset + Shift en Incident.

### Costos

- `SiteId` duplicado en `domain/shift/` (deuda P1; unificar en sprint siguiente).
- Validación de Site incompleta en Shift y listados (deuda P1).
- Dos modelos de persistencia coexisten: Event Log (Incident/Shift parcial) y tabla CRUD (Site/Asset).

## Criterio de revisión

Revisar cuando una Field Story exija mutación de Site, auditoría vía Event Log, o FK por requisito operativo real.
