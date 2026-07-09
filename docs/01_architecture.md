# Arquitectura

## Estilo

Monolito modular.

## Capas

Domain

Application

Infrastructure

## Reglas

- El dominio nunca importa NestJS.
- El dominio genera Domain Events.
- La aplicación coordina casos de uso.
- Infrastructure implementa puertos.

## Persistencia

Projection Tables

↓

Events

↓

Outbox

Todo dentro de una única transacción.

## Estado actual

Walking Skeleton completo.