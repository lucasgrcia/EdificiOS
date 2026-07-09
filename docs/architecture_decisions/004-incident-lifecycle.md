# ADR-004 — Incident Lifecycle

Estado:
Aceptado

Fecha:
2026-07-09

## Contexto

El trabajo operativo de un edificio no consiste únicamente en registrar incidencias.

Cada incidente posee un ciclo de vida claramente definido que debe poder reconstruirse históricamente.

## Decisión

El agregado Incident tendrá el siguiente ciclo de vida inicial:

DETECTED
↓

ASSIGNED
↓

IN_PROGRESS
↓

RESOLVED

Cada transición:

- valida reglas del dominio;
- genera exactamente un Domain Event;
- persiste la proyección;
- persiste el evento;
- escribe el registro correspondiente en la Outbox.

Todo ocurre dentro de una única transacción.

## Consecuencias

### Beneficios

- Historial completo.
- Auditoría.
- Base sólida para automatizaciones futuras.
- Integración con otros contextos mediante eventos.

### Limitaciones

El ciclo podrá ampliarse únicamente cuando una historia de campo real demuestre que resulta insuficiente.

No se agregarán estados "por las dudas".

## Criterio de revisión

Toda modificación del ciclo deberá estar respaldada por una nueva Field Story validada en producción.