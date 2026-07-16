# Architecture Review 01 — Value Objects duplicados

**Versión:** post `0.18.0-alpha`  
**Fecha:** 2026-07-15  
**Alcance:** bounded context `operations` — capa `domain`  
**Restricción:** sin cambio de comportamiento, serialización ni contratos HTTP.

---

## Objetivo

Detectar Value Objects duplicados que representan el mismo concepto, conservar una única implementación por concepto y actualizar imports sin introducir VOs nuevos.

Conceptos auditados: `ActorId`, `SiteId`, `IncidentId`, `WorkOrderId`, `NotificationId`, `EventId`.

---

## Análisis

Inventario en `src/operations/domain/**/value-objects/`:

| Concepto | Ubicaciones | ¿Duplicado? |
|----------|-------------|-------------|
| `SiteId` | `site/`, `shift/` | Sí — implementación idéntica |
| `ActorId` | `actor/`, `evidence/` | Sí — reglas de validación distintas |
| `IncidentId` | `work-order/` únicamente | No — `IncidentAggregate` usa `string` |
| `WorkOrderId` | `work-order/` únicamente | No |
| `NotificationId` | `notification/` únicamente | No |
| `EventId` | No existe como VO | No — identificadores de evento son `string` en dominio |

Adicional: `OperatorId` en `shift/` no se usa en el agregado (Shift emplea `ActorId`). No es duplicación activa; queda fuera de alcance (código muerto, no refactorizado).

---

## Hallazgos

### 1. `SiteId` duplicado (corregido)

`site/value-objects/site-id.ts` y `shift/value-objects/site-id.ts` eran copias byte-a-byte: trim, validación de vacío, `toString()`, `equals()`.

Consumidores:

- `site/site.ts`, `asset/asset.ts` → canonical en `site/`
- `shift/shift.ts` → copia local en `shift/`

### 2. `ActorId` con semánticas incompatibles (no corregido)

| Implementación | Validación | Normalización |
|----------------|------------|---------------|
| `actor/value-objects/actor-id.ts` | UUID obligatorio | `toLowerCase()` |
| `evidence/value-objects/actor-id.ts` | string no vacío | `trim()` |

`Evidence.capture()` acepta `actor-1`; `Actor.register()` exige UUID. Unificar sin cambiar reglas alteraría tests (`test/evidence.spec.ts`, `test/actor.spec.ts`) y comportamiento observable.

### 3. Sin duplicación en otros IDs

- `IncidentId` solo en WorkOrder (referencia tipada al agregado Incident).
- `NotificationId`, `WorkOrderId`, `AssetId`, `ShiftId`, `EvidenceId` — una implementación cada uno.

---

## Cambios realizados

1. `shift/shift.ts` importa `SiteId` desde `../site/value-objects/site-id`.
2. Eliminado `shift/value-objects/site-id.ts`.
3. `test/shift.spec.ts` — import actualizado al canonical.

**Duplicaciones eliminadas:** 1 (`SiteId`).

---

## Decisiones

- **Canonical `SiteId`:** `domain/site/value-objects/site-id.ts` — Site es el agregado dueño del identificador de edificio; Asset y Shift ya lo referenciaban implícitamente.
- **`ActorId`:** no unificar en esta review. La divergencia refleja deuda documentada (backlog P1 #4); unificar implica elegir UUID estricto o string libre — cambio de comportamiento.

---

## Trade-offs

| Decisión | Beneficio | Coste |
|----------|-----------|-------|
| Consolidar `SiteId` | Identidad compartida Asset ↔ Shift ↔ Site; TypeScript detecta mezclas | Ninguno — equivalencia probada por tests |
| Dejar `ActorId` dual | Cero riesgo de regresión en Evidence | Deuda P1 permanece |

---

## Deuda remanente

- **P1 #4:** dos `ActorId` con reglas distintas (`actor/` vs `evidence/`).
- **P1 #3:** resuelto — `SiteId` único.
- `IncidentAggregate.id` sigue siendo `string` sin VO — no es duplicación; decisión histórica del agregado.

---

## Conclusión

Se eliminó la única duplicación segura (`SiteId`). `ActorId` permanece dual por incompatibilidad de validación; corregirlo requiere una Field Story o ADR que fije la regla de identidad operativa. El resto de IDs auditados no presentan duplicación.
