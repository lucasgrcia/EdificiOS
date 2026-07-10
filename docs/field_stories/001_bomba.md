# Historia 001 — Bomba principal con olor a quemado

## Contexto

**Site:** Torre B (agregado explícito)
**Turno:** Mañana
**Actor principal:** Encargado

---

## Site involucrado

El edificio ya no es implícito: existe como agregado **Site** registrado en el sistema antes de cualquier Asset:

| Atributo | Valor |
|----------|-------|
| Nombre | Torre B |
| Dirección | Av. Corrientes 1234, CABA |
| Zona horaria | America/Argentina/Buenos_Aires |
| Tipo de edificio | Residencial |

Todo Asset pertenece obligatoriamente a este Site.

---

## Asset involucrado

El Incident se detecta sobre un Asset ya registrado en el Site:

| Atributo | Valor |
|----------|-------|
| Nombre | Bomba principal |
| Tipo | Bomba |
| Ubicación | Subsuelo — Torre B |
| Fabricante | Grundfos |
| Modelo | CR 32-4 |
| Número de serie | SN-12345 |
| Criticidad | HIGH |

---

## ¿Qué ocurrió realmente?

Durante la recorrida de rutina del turno de la mañana, el encargado detecta olor a quemado y una pérdida de agua en la **Bomba principal** del subsuelo.

Sin detener su recorrida, abre la aplicación, toma una fotografía, dicta una breve descripción y envía el registro. El sistema asocia el hecho al Asset correspondiente.

La administración recibe la novedad inmediatamente y puede iniciar la coordinación con el proveedor correspondiente.

---

## ¿Qué necesitó cada persona?

### Encargado

Registrar el hecho en menos de 15 segundos sin clasificar categorías ni completar formularios. El Asset ya existe en el sistema; no debe recordar identificadores técnicos.

### Administrador

Conocer rápidamente qué Asset presenta la anomalía — nombre, ubicación, fabricante y modelo — y disponer de Evidence suficiente para coordinar la reparación.

### Proveedor

Recibir información clara sobre el Asset afectado antes de llegar al edificio.

---

## ¿Qué hizo el sistema?

Verificó que el Site existía al registrar el Asset, que el Asset existía y que había un Shift activo en el Site, detectó el Incident asociado al Asset y al Turno, conservó la Evidence y notificó a la administración.

---

## ¿Qué aprendimos?

La memoria del edificio no puede depender de conversaciones verbales ni de mensajes informales.

El conocimiento operativo debe permanecer disponible aunque cambie el encargado del turno.

Un Incident sin Asset identificado no tiene contexto operativo en el edificio.

Todo Asset pertenece obligatoriamente a un Site existente.

Un Incident solo puede detectarse dentro de un Shift activo del Site.

---

## Preguntas abiertas

- ¿Había cobertura de red?
- ¿El Asset tenía código QR visible?
- ¿Cuánto tiempo demoró el registro?
- ¿Fue necesario registrar más de una fotografía?

---

## Eventos derivados (Equipo Técnico)

- workflow.flow.detected

---

## Estado de validación

🟢 Observado
