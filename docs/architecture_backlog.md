# Architecture Backlog

Deuda arquitectónica consolidada de las Architecture Reviews (Sprint 1 → Sprint 6).

Este documento es la **fuente canónica** de ítems P1 y P2. `docs/05_current_status.md` resume el estado del proyecto; aquí vive el detalle priorizado.

**Reglas de uso:**

- P1 debe resolverse en el sprint siguiente o en el que el ítem bloquee un flujo real.
- P2 es deuda consciente: documentada, aceptada, sin fecha obligatoria.
- No agregar ítems sin justificación vinculada a una review, ADR o Field Story.
- Al cerrar un ítem, marcarlo como resuelto con sprint y PR.

Última consolidación: 2026-07-10 (post Sprint 10).

---

## P1 — Resolver en el siguiente sprint

Ordenados por impacto estructural descendente.

### 1. Event Log incompleto para contexto operativo de detección

**Origen:** Sprint 4 PR5, Sprint 6 PR5, ADR-002.

**Problema:** `workflow.flow.detected` no incluye `assetId`, `shiftId` ni `actorId` en payload. La proyección sí los tiene. `IncidentAggregate.replay()` reconstruye esos campos en `null`.

**Justificación:** la proyección no puede regenerarse solo desde el Event Log. Cada nuevo campo operativo amplía la brecha con ADR-002.

**Dirección mínima:** extender payload de `workflow.flow.detected` (schema v2 o campos adicionales en v1) y alinear `replay()`.

---

### 2. Integridad referencial asimétrica en Application

**Origen:** Sprint 5 Review, ADR-007.

**Problema:** sin Foreign Keys, la coherencia depende 100 % de casos de uso. Hoy está implementada a medias:

| Flujo | Valida Site | Valida Actor |
|-------|-------------|--------------|
| `RegisterAssetUseCase` | Sí | — |
| `StartShiftUseCase` | No | Sí |
| `DetectIncidentUseCase` | Indirecto (vía Asset + Shift) | No (confía en Shift) |
| `ListAssetsBySiteUseCase` | No (devuelve `[]`) | — |

**Justificación:** el sistema puede operar sobre Sites o referencias fantasma. La regla *“todo Asset pertenece a un Site existente”* no se aplica en todos los caminos.

**Dirección mínima:** `SiteRepository.findById()` en `StartShiftUseCase` y `ListAssetsBySiteUseCase` (mismo patrón que Asset).

---

### 3. `SiteId` duplicado en dominio

**Origen:** Sprint 5 Review, ADR-007 consecuencias.

**Problema:** coexisten `domain/site/value-objects/site-id.ts` y `domain/shift/value-objects/site-id.ts`. Son tipos distintos con la misma semántica.

**Justificación:** rompe identidad compartida entre agregados; `equals()` no cruza límites; refactors de Site pueden desalinear Asset y Shift sin que TypeScript lo detecte.

**Dirección mínima:** un único `SiteId` importado por Asset y Shift.

---

### 4. Dos `ActorId` con reglas distintas

**Origen:** Sprint 6 PR5 Review.

**Problema:** `domain/actor/value-objects/actor-id.ts` exige UUID; `domain/evidence/value-objects/actor-id.ts` acepta string libre. `AssignIncidentInput` usa `string`; `Incident.detect()` usa el VO de Actor.

**Justificación:** el modelo no comparte identidad tipada entre Evidence, Incident y Actor. Riesgo de datos incompatibles entre contextos.

**Dirección mínima:** unificar en el VO de Actor (UUID) o documentar shared kernel explícito.

---

### 5. Concurrencia optimista ausente

**Origen:** Sprint 1 Review, Sprint 4 PR5, Sprint 6 PR5.

**Problema:**

- Dos `POST .../assign` concurrentes sobre el mismo Incident en `DETECTED` → last-write-wins.
- `StartShiftUseCase` + `DetectIncidentUseCase` concurrentes → posible race entre dos Shifts `OPEN`.
- Lectura de Shift activo fuera de transacción → TOCTOU entre lectura y detección.

**Justificación:** en operación real de edificio, transiciones simultáneas son plausibles. Sin guard, el Event Log puede contradecir la proyección.

**Dirección mínima:** `UPDATE ... WHERE status = 'DETECTED'` en `updateProjection`; re-validar Shift activo dentro de la transacción de detección.

---

### 6. Proyecciones legacy sin campos obligatorios

**Origen:** Sprint 4 PR5, Sprint 6 PR5.

**Problema:** Incidents detectados antes de `shiftId` o `actorId` en proyección rompen `rehydrateIncident()` en transiciones posteriores.

**Justificación:** breaking change operativo en entornos con datos previos al alpha.

**Dirección mínima:** script de backfill o nota de bootstrap: no transicionar Incidents legacy sin reconciliar `current_projection_state`.

---

### 7. Errores de dominio sin mapeo HTTP consistente

**Origen:** Sprint 1 Review, Sprint 4 PR4.

**Problema:** transiciones inválidas y reglas de Shift cerrado devuelven 500. Solo algunos errores tipados tienen mapeo (`AssetNotFoundError` → 404, `NoActiveShiftError` → 409).

**Justificación:** el adaptador HTTP contradice semántica de negocio ya establecida en otros endpoints.

**Dirección mínima:** 404 para recurso inexistente; 409 para transición inválida o conflicto operativo.

---

### 8. Proyección construida manualmente en Application

**Origen:** Sprint 1 Review, Sprint 6 PR5.

**Problema:** cada caso de uso arma `currentProjectionState` campo a campo. El agregado emite eventos; la proyección no se deriva del evento recién persistido.

**Justificación:** doble fuente de verdad (evento vs jsonb). Cada campo nuevo (`actorId`, timestamps de transición) aumenta riesgo de deriva.

**Dirección mínima:** derivar proyección del Domain Event emitido o exponer `applyToProjection()` desde el agregado (cuando una Field Story lo exija).

---

### 9. Validar Domain Event antes de `associate()` en Evidence

**Origen:** Sprint 2, `05_current_status.md`.

**Problema:** `CaptureEvidenceUseCase` / asociación Event ↔ Evidence no verifica que el evento exista en el Event Log antes de enlazar.

**Justificación:** evidencia huérfana o asociada a un id inventado rompe la cadena Event → Evidence de ADR-006.

---

### 10. `storageReference` acoplado a generación manual

**Origen:** Sprint 2 PR2 Review.

**Problema:** la referencia de almacenamiento se construye fuera de `FileStorage.generateReference()`.

**Justificación:** el puerto de almacenamiento debería ser la única fuente de rutas válidas; hoy Application puede inventar referencias incompatibles con la implementación local.

---

### 11. Paginación en `ListSitesUseCase`

**Origen:** Sprint 5 Review.

**Problema:** `findAll()` sin límite ni filtro.

**Justificación:** incompatible con escala multi-edificio. Aceptable en MVP; debe resolverse antes de exponer la API a operadores con decenas de Sites.

---

### 12. TOCTOU en `RegisterAssetUseCase`

**Origen:** Sprint 5 Review.

**Problema:** `findById(siteId)` → `register()` → `save()` sin transacción. El Site puede dejar de existir entre pasos 1 y 3.

**Justificación:** Asset huérfano en `assets` sin FK. La carrera es residual pero real en entornos concurrentes.

**Dirección mínima:** usar `site.id` del registro cargado; mitigación real = transacción Site + Asset cuando exista patrón transaccional para agregados CRUD.

---

### 13. Tests HTTP de Incident ausentes

**Origen:** Sprint 4 PR5, Sprint 6 PR5.

**Problema:** no existe `incident.http.integration.spec.ts`. El contrato HTTP de detección (sin `actorId`, `409` sin Shift) se valida solo en tests de Application.

**Justificación:** hueco entre caso de uso y adaptador HTTP; errores de mapeo no se detectan en CI.

---

### 14. Unificar `DetectIncidentUseCase` con helper de persistencia

**Origen:** Sprint 1 Review.

**Problema:** transiciones usan `persistIncidentTransition`; detect tiene lógica inline duplicada.

**Justificación:** dos caminos de persistencia aumentan costo y riesgo en cada cambio del flujo de detección.

---

### 15. Alinear Field Story 006 — nombres de eventos

**Origen:** `05_current_status.md`.

**Problema:** Field Story 006 lista eventos que no coinciden con los implementados (`operations.shift.*` vs `shift.continuity.*`).

**Justificación:** narrativa de campo desalineada del Event Log real confunde revisiones y onboarding.

---

## P2 — Deuda consciente

Aceptada. No bloquea sprints. Revisar cuando una Field Story o ADR lo exijan.

### Modelo y dominio

| Ítem | Origen | Justificación |
|------|--------|---------------|
| Dos filosofías de persistencia (Event Log vs CRUD inmutable) | Sprint 5 Review | Site/Asset/Actor sin eventos; Incident/Shift parcial. Fork documentado en ADR-003/007. |
| Tensión Flow vs Incident | Sprint 1 Review | Agregado `Incident`, eventos `workflow.flow.*`, parámetro `flowId`. Flow no es entidad aún. |
| `description` duplicada en columna SQL y jsonb | Sprint 1 Review | Heredado del Walking Skeleton. Unificar cuando la proyección madure. |
| VOs de Site sin semántica de campo (`TimeZone`, `BuildingType`) | Sprint 5 Review | Strings no vacíos; Field Stories mencionan IANA y tipología. Aceptable field-first. |
| `RegisterAssetUseCase` carga Site y lo descarta | Sprint 5 Review | Valida existencia pero no usa el registro en el agregado. |
| `replay()` deja `assetId`/`shiftId`/`actorId` en `null` | Sprint 4/6 PR5 | Decisión explícita hasta evolucionar schema del evento. |
| `SitesController` como fachada de Site + Asset + Shift | Sprint 5 Review | Site no es agregado padre en dominio; HTTP sugiere jerarquía que DDD no modela. |
| Columna `operator_id` en DB vs `actorId` en dominio | Sprint 6 PR4 | Mapeo en infraestructura; renombrar en migración futura. |
| `Actor.siteId` solo en `ActorRecord`, no en agregado | Sprint 6 PR1 | Site del Actor vive en persistencia; dominio no lo expone aún. |

### Event Log y proyección

| Ítem | Origen | Justificación |
|------|--------|---------------|
| `events.actor_id` en `null` para `workflow.flow.detected` | Sprint 6 PR5 | Alcance del PR excluyó Event Log. Metadata podría llevar Actor sin tocar payload. |
| Proyecciones legacy sin `status` | Sprint 1 Review | Solo aplica si existiera data del Sprint 0 sin migrar. |

### HTTP y contratos

| Ítem | Origen | Justificación |
|------|--------|---------------|
| Body con `actorId` ignorado en detección | Sprint 6 PR5 | Pipe no lo lee; cliente podría creer que influye. Sin auth, riesgo bajo en MVP. |

### Documentación y narrativa

| Ítem | Origen | Justificación |
|------|--------|---------------|
| Field Stories 002/003 usan “Sitio” implícito | Sprint 5 Review | No afecta código; coherencia narrativa pendiente. |
| Field Stories 004/006 sin Actor explícito | Sprint 6 PR5 | 001 y 005 actualizadas; resto menor. |
| `CHANGELOG` incompleto para Sprint 6 PR1–PR4 | Sprint 6 PR5 | `05_current_status.md` sí los lista. |
| Tests de dominio Incident solo vía use cases | Sprint 1 Review | `incident-p0-guards` y `replay` cubren lo crítico. |

### Políticas operativas

| Ítem | Origen | Justificación |
|------|--------|---------------|
| Almacenamiento local filesystem | `05_current_status.md` | Hasta que una Field Story exija otra cosa. |
| SHA-256 verifica integridad, no identidad | `05_current_status.md` | Sin deduplicación por hash; dos capturas idénticas son dos Evidence distintas. |
| Datos legacy con `site_id` huérfano | Sprint 5 Review | Migración `006` después de `004`/`005`. Bootstrap: Site primero. |

### Sprint 9 — Notification (futuro)

| Ítem | Origen | Justificación |
|------|--------|---------------|
| Lectura de notifications (GET, list by recipient) | Sprint 9 PR5 | Creación HTTP + dashboard `recentNotifications`; falta list by recipient |
| Mark as read | Sprint 9 PR1 | Estado `READ` en dominio sin caso de uso ni transición |
| Delivery providers (email, push, in-app real) | Sprint 9 PR4/PR5 | Notification es intención persistida; sin envío real |
| Event Log enriquecido para notificaciones automáticas | Sprint 9 PR4 | Integración post-detección fuera de transacción Incident; sin evento de dominio Notification |

### Sprint 10 — Timeline (futuro)

| Ítem | Origen | Justificación |
|------|--------|---------------|
| `incident_id` en `notifications` | Sprint 10 PR1 | Correlación heurística (actores + ventana 60s) para `INCIDENT_DETECTED` |
| Historial de transiciones WorkOrder en timeline | Sprint 10 PR1 | Solo `WORK_ORDER_CREATED`; updates no generan filas en Event Log |
| Paginación / límite en timeline HTTP | Sprint 10 PR3 | Endpoint devuelve timeline completo sin paginar |
| Metadata de Evidence en timeline | Sprint 10 PR1 | Solo `event_evidences`; sin lectura de tabla `evidences` |

---

## Resueltos (referencia)

| Ítem | Sprint | Notas |
|------|--------|-------|
| `SiteNotFoundError` sin mapeo HTTP en Asset | Sprint 5 PR5 | `AssetsController` → 404 |
| Assert exactamente un Domain Event en persistencia | Sprint 1 cierre | `pullExactlyOneDomainEvent` |
| `updateProjection` falla si `rowCount !== 1` | Sprint 1 cierre | Guard en repositorio |
| `workflow.flow.resolved` sin Field Story | Sprint 1 cierre | Documentado en field stories y status |
| Evidence con `IncidentId` obligatorio | Sprint 2 PR1 Review | Evidence independiente de Incident (ADR-006) |
| `operatorId` en Shift | Sprint 6 PR4 | Reemplazado por `actorId` en dominio y HTTP |

---

## Deliberadamente ausente

No son deuda: decisiones de producto documentadas en `05_current_status.md`.

- Autenticación y autorización
- Sincronización offline
- Event Bus distribuido (RabbitMQ, Redis)
- Almacenamiento en nube
- OCR / IA
- Foreign Keys entre agregados
- CQRS completo
- Event Sourcing completo
