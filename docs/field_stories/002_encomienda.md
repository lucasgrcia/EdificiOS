# Historia 002 — Recepción de encomienda

## Contexto

**Sitio:** Portería
**Turno:** Mañana
**Actor principal:** Encargado

---

## ¿Qué ocurrió realmente?

Una empresa de encomiendas entrega un paquete destinado a la unidad 402.

El residente no se encuentra en el edificio.

El encargado recibe el paquete, registra el ingreso y lo guarda en un casillero de la portería.

Posteriormente el residente recibe una notificación indicando que su encomienda está disponible.

---

## ¿Qué necesitó cada persona?

### Encargado

Registrar rápidamente la recepción y saber dónde quedó almacenado el paquete.

### Residente

Saber que su encomienda llegó sin necesidad de consultar en portería.

---

## ¿Qué hizo el sistema?

Asoció automáticamente la encomienda con la unidad correspondiente, registró la custodia y notificó al residente.

---

## ¿Qué aprendimos?

La custodia de objetos constituye un flujo operativo independiente de las incidencias del edificio.

---

## Preguntas abiertas

- ¿Qué ocurre si el código de barras no puede leerse?
- ¿Puede existir más de una encomienda para la misma unidad?
- ¿Cómo se maneja un paquete extremadamente grande?

---

## Eventos derivados

- trust.custody.consigned

---

## Estado de validación

🟢 Observado