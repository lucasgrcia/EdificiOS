# ADR-003 — No Generic CRUD

Estado:
Aceptado

Fecha:
2026-07-09

## Contexto

Los sistemas CRUD tradicionales permiten modificar entidades desde cualquier lugar del código.

Esto rompe la trazabilidad y elimina el significado de las acciones del dominio.

## Decisión

Los agregados no expondrán métodos genéricos como:

- update()
- setStatus()
- patch()
- edit()

Cada cambio deberá expresarse mediante una intención del negocio.

Ejemplos:

- detect()
- assign()
- start()
- resolve()

Cada intención genera exactamente un Domain Event.

## Consecuencias

### Beneficios

- Mayor claridad.
- Historial completo.
- Dominio expresivo.
- Imposibilidad de mutaciones arbitrarias.

### Costos

- Más clases.
- Más métodos específicos.
- Curva de aprendizaje ligeramente mayor.

## Criterio de revisión

Nunca se aceptarán endpoints CRUD genéricos sin una justificación respaldada por una historia de campo.