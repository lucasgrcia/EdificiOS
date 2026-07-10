# Historia 004 — Inspección de piscina

## Contexto

**Site:** Piscina (agregado explícito)
**Turno:** Mañana

---

## Site involucrado

El sector operativo existe como agregado **Site** registrado en el sistema:

| Atributo | Valor |
|----------|-------|
| Nombre | Piscina |
| Dirección | Sector piscina — complejo residencial |
| Zona horaria | America/Argentina/Buenos_Aires |
| Tipo de edificio | Amenities |

Todo Asset pertenece obligatoriamente a este Site.

---

## Asset involucrado

La inspección y la eventual detección de anomalía se refieren a un Asset registrado en el Site:

| Atributo | Valor |
|----------|-------|
| Nombre | Sistema de tratamiento de piscina |
| Tipo | Tratamiento de agua |
| Ubicación | Sector piscina |
| Fabricante | — |
| Modelo | — |
| Número de serie | — |
| Criticidad | MEDIUM |

---

## ¿Qué ocurrió realmente?

Durante la inspección rutinaria, el encargado mide los parámetros químicos del agua del Asset **Sistema de tratamiento de piscina**.

El nivel de cloro es inferior al permitido.

Registra los valores observados.

---

## ¿Qué necesitó cada persona?

### Encargado

Ingresar únicamente los datos obtenidos durante la medición, asociados al Asset que está inspeccionando.

### Administración

Conocer que la piscina — a través de su Asset de tratamiento — requiere intervención.

---

## ¿Qué hizo el sistema?

Verificó que el Site existía al registrar el Asset, registró la inspección y detectó automáticamente que los valores requieren atención sobre el Asset involucrado, dentro del Shift activo del Site.

---

## ¿Qué aprendimos?

El operador registra hechos.

El sistema interpreta las consecuencias.

La intervención se entiende en términos del Asset físico del edificio, no de un identificador abstracto.

Todo Asset pertenece obligatoriamente a un Site existente.

---

## Preguntas abiertas

- ¿Los valores cambian durante el día?
- ¿Debe repetirse la medición?
- ¿Qué margen de tolerancia existe?

---

## Eventos derivados

- operations.inspection.completed
- workflow.flow.detected

---

## Estado de validación

🟡 Hipótesis pendiente
