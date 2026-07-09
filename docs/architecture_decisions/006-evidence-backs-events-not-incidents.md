Evidence respalda hechos, no entidades

Una Evidence nunca pertenece directamente a un Incident.

Una Evidence respalda un Domain Event.

Razones:

un mismo hecho puede tener múltiples evidencias
una evidencia puede respaldar múltiples hechos
la historia del edificio es el Event Log
la evidencia fortalece la historia, no la entidad

Consecuencia:

Nunca modelar:

Incident
 └── evidences[]

Siempre modelar:

Event

↓

Evidence

↓

Association

Ese ADR probablemente les ahorre muchísimas discusiones futuras.