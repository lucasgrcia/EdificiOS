# Historia 005 — Falla en ascensor

## Contexto

**Site:** Torre B (agregado explícito)
**Turno:** Tarde

---

## Site involucrado

El edificio existe como agregado **Site** registrado en el sistema:

| Atributo | Valor |
|----------|-------|
| Nombre | Torre B |
| Dirección | Av. Corrientes 1234, CABA |
| Zona horaria | America/Argentina/Buenos_Aires |
| Tipo de edificio | Residencial |

Todo Asset pertenece obligatoriamente a este Site.

---

## Asset involucrado

El Incident se detecta sobre un Asset registrado en el Site:

| Atributo | Valor |
|----------|-------|
| Nombre | Ascensor A |
| Tipo | Ascensor |
| Ubicación | Torre B — núcleo vertical |
| Fabricante | — |
| Modelo | — |
| Número de serie | — |
| Criticidad | CRITICAL |

---

## ¿Qué ocurrió realmente?

Un residente informa que el **Ascensor A** se detiene entre pisos.

El encargado verifica la situación, registra la Evidence y comunica el Incident mediante la aplicación, referenciando el Asset afectado.

Posteriormente el administrador coordina la intervención del proveedor.

---

## ¿Qué necesitó cada persona?

### Encargado

Registrar rápidamente la falla sobre el Asset correcto.

### Administrador

Conocer el estado actual del Flow y su responsable, con el Asset identificado desde el inicio.

### Proveedor

Disponer de la información del Asset — ubicación, tipo y criticidad — antes de concurrir al edificio.

---

## ¿Qué hizo el sistema?

Verificó que el Site existía al registrar el Asset, que el Asset existía y que había un Shift activo en el Site, resolvió el Actor del Turno, detectó el Incident sobre **Ascensor A** asociado al Turno y al Actor, y conservó la secuencia completa del Flow desde su detección hasta la resolución.

---

## ¿Qué aprendimos?

Las transiciones del trabajo deben quedar respaldadas por hechos observables y nunca depender de modificaciones manuales del estado.

Un Incident de criticidad CRITICAL exige un Asset conocido desde la detección.

Todo Asset pertenece obligatoriamente a un Site existente.

Todo Incident queda vinculado al Shift activo y al Actor del Turno en el momento de su detección.

---

## Preguntas abiertas

- ¿Puede quedar fuera de servicio parcialmente?
- ¿Qué sucede si el proveedor rechaza el trabajo?
- ¿Cómo se informa a los residentes?

---

## Eventos derivados

- workflow.flow.detected
- workflow.flow.assigned
- workflow.flow.execution_started
- workflow.flow.resolved

---

## Estado de validación

🟢 Ciclo de vida completo validado (detección → asignación → ejecución → resolución)
