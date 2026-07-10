# Glosario — Lenguaje ubicuo de EdificiOS

Fuente canónica de términos del dominio. Supersede `docs/03_glossary.md` (parcial y desactualizado).

Usar estos términos en código, documentación, Field Stories y Architecture Reviews. Las traducciones al español del día a día del edificio (encargado, portero) son narrativas; el modelo habla el idioma de esta tabla.

---

## Agregados y entidades

### Site

El edificio como unidad operativa explícita. Agregado raíz inmutable (`register`, `rehydrate`). Todo Asset, Shift y Actor operan dentro de un Site.

**No usar:** Sitio (solo en narrativa de usuario si no hay alternativa), Building como identificador de código.

**Persistencia:** tabla `sites`. Sin Domain Events en el MVP actual.

---

### Asset

Activo físico del edificio (bomba, ascensor, sistema de piscina). Agregado raíz inmutable. Pertenece obligatoriamente a un Site existente.

**No usar:** Equipment, Resource, Device como nombre de agregado.

**Referencia:** `SiteId` por identidad; Site no conoce sus Assets.

---

### Actor

Persona que opera el edificio durante un Turno (portero, administrador, seguridad, técnico). Agregado raíz inmutable. Se registra en un Site.

**No usar:** User, Operator, Guardia, Empleado como nombre de dominio.

**Roles MVP:** `PORTER`, `ADMINISTRATOR`, `SECURITY`, `TECHNICIAN`.

**Estados:** `ACTIVE`, `INACTIVE`.

---

### Shift

Turno operativo. Ventana de continuidad en la que el edificio está atendido. Agregado con ciclo `OPEN → CLOSED`. Un solo Shift `OPEN` por Site.

**No usar:** Guardia, Turn (en código), Schedule.

**Eventos de dominio:** `shift.continuity.started`, `shift.continuity.closed`.

**Al iniciar:** se asocia un `Actor` (`actorId`). Ese Actor es quien representa la continuidad del Turno.

---

### Incident

Problema operativo detectado en el edificio. Agregado con ciclo de vida:

```
DETECTED → ASSIGNED → IN_PROGRESS → RESOLVED
```

**No usar:** Ticket, Task, Issue, Case.

**Eventos de dominio (Flow):** `workflow.flow.detected`, `workflow.flow.assigned`, `workflow.flow.execution_started`, `workflow.flow.resolved`.

**Contexto en detección:** requiere Asset existente, Shift activo del Site del Asset, y Actor resuelto desde ese Shift. El cliente no envía `actorId` al detectar.

**Campos de proyección relevantes:**

| Campo | Significado |
|-------|-------------|
| `actorId` | Actor del Turno al momento de la detección |
| `assignedActorId` | Actor al que se asignó el Incident en la transición `assign` |
| `assetId` | Asset sobre el que se detectó |
| `shiftId` | Shift activo al detectar |

---

### Evidence

Prueba física capturada durante un Turno (foto, video, audio). Entidad inmutable. **No pertenece a Incident**; respalda un Domain Event (ADR-006).

**No usar:** Attachment, File, Media como nombre de dominio.

**Campos:** `evidenceId`, `actorId` (quien capturó), `storageReference`, `mimeType`, `caption`, `capturedAt`.

---

## Conceptos transversales

### Flow

El ciclo de trabajo asociado a un Incident. En el MVP no es un agregado ni una clase de dominio: es el **nombre del workflow** reflejado en eventos `workflow.flow.*` y en el parámetro `flowId` (identificador del Domain Event que registra cada transición).

**Pregunta abierta (P2):** si Flow evoluciona a agregado propio, requiere Field Story que lo justifique.

---

### Event (Domain Event)

Hecho irreversible ocurrido en el dominio. Inmutable. Append-only en el Event Log. Toda transición relevante de Incident y Shift produce exactamente un Domain Event por transición.

**No confundir con:** evento de infraestructura, mensaje de Outbox (aunque la Outbox transporta el evento).

---

### Event Log

Fuente de verdad del sistema (ADR-002). Tabla `events`. Las proyecciones son vistas derivadas; nunca la verdad primaria.

**Regla:** prohibido modificar proyección sin un evento que lo justifique.

---

### Projection (proyección)

Vista optimizada para lectura. Tabla `incidents` con `current_projection_state` (jsonb). Se actualiza en la misma transacción que el Domain Event y la Outbox.

**Deuda conocida (P1):** algunos campos de proyección (`assetId`, `shiftId`, `actorId`) no están en el payload del evento `workflow.flow.detected`; el replay no los reconstruye.

---

### Outbox

Tabla `outbox`. Registro pendiente de publicación de un Domain Event. Patrón Transactional Outbox. Escribe en la misma transacción que el Event Log y la proyección.

---

### Policy

Regla de negocio del edificio. Concepto de dominio futuro; no es un agregado implementado en el MVP.

**No usar:** Config, Setting, Rule como sustituto en código de dominio.

---

### Space

Espacio físico del edificio (piso, unidad, área común). Término del lenguaje ubicuo; agregado no implementado en el MVP.

---

### Work

Concepto de negocio genérico. **No es una clase del dominio.** El trabajo concreto se modela como Incident, inspección futura, custodia futura, etc.

---

## Cadena operativa actual (MVP)

Flujo de detección de Incident:

```
Site
  └── Asset (siteId)
        └── Shift activo del Site
              └── Actor del Shift (actorId)
                    └── Incident.detect()
```

Registro previo típico:

```
POST Site → POST Asset → POST Actor → POST Shift/start → POST Incident (detect)
```

---

## Términos prohibidos en código y dominio

| Prohibido | Usar en su lugar |
|-----------|------------------|
| Ticket | Incident |
| Task | Incident / Work (concepto) |
| Issue | Incident |
| Attachment | Evidence |
| Setting | Policy |
| Config | Policy |
| Guardia | Actor / Shift (según contexto) |
| Operator | Actor |
| User | Actor (hasta que exista autenticación) |

---

## Límites entre agregados

| Relación | Tipo | Dónde se valida |
|----------|------|-----------------|
| Asset → Site | Referencia por `SiteId` | `RegisterAssetUseCase` |
| Shift → Site | Referencia por `SiteId` | Application (parcial; P1) |
| Shift → Actor | Referencia por `ActorId` | `StartShiftUseCase` |
| Actor → Site | Referencia en persistencia | `RegisterActorUseCase` |
| Incident → Asset | Referencia por `AssetId` | `DetectIncidentUseCase` |
| Incident → Shift | Referencia por `ShiftId` | `DetectIncidentUseCase` |
| Incident → Actor (detección) | Derivado del Shift activo | `DetectIncidentUseCase` |
| Evidence → Event | Asociación post-captura | `CaptureEvidenceUseCase` / PR3 |

**Regla:** sin Foreign Keys entre agregados. Integridad en Application.

---

## Referencias

- Constitución de ingeniería: `AGENTS.md`
- Reglas de modelado: `docs/06_rules.md`
- Decisiones arquitectónicas: `docs/architecture_decisions/`
- Deuda priorizada: `docs/architecture_backlog.md`
- Estado del proyecto: `docs/05_current_status.md`
