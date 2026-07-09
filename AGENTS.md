# AGENTS.md

# EdificiOS Engineering Constitution

Todo cambio debe respetar estas reglas.

## Dominio

El dominio es TypeScript puro.

Nunca puede importar:

- NestJS
- Prisma
- Express
- PostgreSQL
- RabbitMQ

---

## Arquitectura

Arquitectura limpia.

domain
↓

application
↓

infrastructure

Nunca al revés.

---

## Lenguaje ubicuo

Usar únicamente:

Incident

Evidence

Policy

Shift

Flow

Actor

Site

Space

Nunca usar:

Ticket

Task

Issue

Attachment

Setting

---

## MVP

Solo existe un flujo:

Detectar una incidencia.

No implementar funcionalidades no solicitadas.

No agregar autenticación.

No agregar RabbitMQ.

No agregar microservicios.

No agregar CQRS.

No agregar Event Sourcing completo.

---

## Filosofía

Si un edificio contradice el modelo,
el edificio tiene razón.

Toda nueva complejidad debe provenir de una observación real.
