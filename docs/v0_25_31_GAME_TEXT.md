# v0.25.31 — Plaza de Copa explicada en "Cómo funciona"

Fase 8 del roadmap (`docs/ROADMAP_AUDITORIA_v0_25_22.md`).

## Cambio

- `src/components/GameHome.tsx`: el párrafo "Europa" de "Cómo funciona" explica la reasignación de la plaza de Copa:
  - Campeón entre los 5 primeros de Liga: su plaza pasa al 6.º (Europa League) y el 7.º va a Conference.
  - Campeón 6.º: conserva su plaza y el 7.º va a Conference.
- `scripts/qaPublicReleaseUx.ts`: comprueba que el texto está.

## Qué ya estaba

- El motivo del resultado al final de temporada: `CareerSeasonOutcome` muestra `objectiveResult.reason` ("Objetivo fallido: no clasificó a Europa ni ganó Copa", "Descenso: ..."). No hacía falta añadirlo.

## Fuente

El texto sigue las reglas de `src/europe/europeanQualification.ts` (comentarios de cabecera) y los casos de `tests/unit/europeanQualification.test.ts`.

## Pendiente

- Revisión del texto por el propietario antes de fusionar.
