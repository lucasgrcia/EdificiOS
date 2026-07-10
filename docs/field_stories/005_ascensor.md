# Historia 005 — Falla en ascensor

## Contexto

**Site:** Torre B
**Turno:** Tarde

---

## Asset involucrado

El Incident se detecta sobre un Asset registrado en el edificio:

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

Verificó que el Asset existía, detectó el Incident sobre **Ascensor A** y conservó la secuencia completa del Flow desde su detección hasta la resolución.

---

## ¿Qué aprendimos?

Las transiciones del trabajo deben quedar respaldadas por hechos observables y nunca depender de modificaciones manuales del estado.

Un Incident de criticidad CRITICAL exige un Asset conocido desde la detección.

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
