# Historia 006 — Entrega de turno

## Contexto

**Site:** Edificio completo
**Cambio:** Turno tarde → Turno noche

---

## ¿Qué ocurrió realmente?

Finaliza un turno operativo e inicia el siguiente.

El operador entrante necesita comprender rápidamente qué situaciones continúan abiertas y qué responsabilidades hereda.

No existe intercambio mediante cuadernos ni conversaciones informales.

La información permanece disponible dentro del sistema.

Cada Incident detectado durante un Turno queda asociado a ese Shift, preservando la continuidad operativa del edificio.

---

## ¿Qué necesitó cada persona?

### Operador saliente

Confirmar qué trabajos continúan abiertos.

### Operador entrante

Comprender el estado operativo del edificio antes de comenzar su recorrida.

---

## ¿Qué hizo el sistema?

Presentó automáticamente los trabajos que continúan activos junto con la evidencia acumulada hasta ese momento.

Rechazó nuevas detecciones de Incident cuando no existía un Shift activo en el Site.

---

## ¿Qué aprendimos?

La verdadera unidad operativa del edificio es el Turno.

El conocimiento pertenece al edificio, no a las personas.

Sin Shift activo no hay detección de Incident: el operador debe abrir continuidad antes de registrar hechos.

---

## Preguntas abiertas

- ¿Puede existir más de un operador simultáneamente?
- ¿Qué ocurre si nadie toma el turno siguiente?
- ¿Qué trabajos requieren transferencia obligatoria?

---

## Eventos derivados

- shift.continuity.started
- shift.continuity.closed
- workflow.flow.detected

---

## Estado de validación

🟢 Observado
