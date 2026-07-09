# ADR-002 — Event Log como Fuente de Verdad

Estado:
Aceptado

Fecha:
2026-07-09

## Contexto

EdificiOS necesita reconstruir la historia completa de un edificio incluso si las proyecciones son eliminadas o regeneradas.

Las tablas de lectura representan únicamente una vista optimizada para consultas.

## Decisión

La fuente de verdad del sistema será el Event Log.

Toda transición relevante del dominio deberá producir un Domain Event inmutable.

Las proyecciones podrán reconstruirse reproduciendo cronológicamente dichos eventos.

Las tablas de lectura nunca serán consideradas la verdad del sistema.

## Consecuencias

### Beneficios

- Auditoría completa.
- Reconstrucción histórica.
- Trazabilidad.
- Integración futura mediante eventos.

### Costos

- Mayor cantidad de registros.
- Necesidad de versionar eventos.
- Mayor disciplina de modelado.

## Restricciones

Queda prohibido modificar manualmente el estado de una proyección sin que exista un evento que lo justifique.

## Criterio de revisión

Solo podrá modificarse si el Event Log deja de representar correctamente la realidad operativa.