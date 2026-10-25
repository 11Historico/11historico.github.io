# v0.25.5 — Marcas europeas de la tabla final

Corrige la tabla de clasificación final de fin de temporada, que mostraba un reparto europeo antiguo.

## Problema

`FinalSummary` marcaba siempre al 5.º y al 6.º como Europa League. Cuando el campeón de Copa ya estaba en Europa por Liga, el marcador de plaza heredada caía en el 7.º y la Conference se marcaba en el 8.º, aunque no tuviera plaza. El Game Over y la clasificación del juego sí usaban el reparto correcto, así que la pantalla se contradecía.

## Solución

- `getFinalTableEuropeanSpot(position, cupWinnerLeaguePosition)` en `src/europe/europeanQualification.ts`: plaza de cada posición de la tabla final, con el mismo reparto de `getLeagueCompetitionSpot`. Si el campeón de Copa no estaba en Champions ni en Europa League por Liga, su plaza es de Europa League vía Copa.
- `src/components/FinalSummary.tsx`: `buildLeagueQualificationMap` usa esa función. Se eliminaron los índices reservados antiguos.

## Validación

- `tests/unit/finalTableMarkers.test.ts`: 6 casos (campeón de Copa en 1.º, 2.º, 5.º, 6.º, fuera de Europa y sin campeón conocido).
- Comprobado en la app con una partida de prueba: campeón de Copa en 17.º, 5.º Europa League vía Liga, 6.º Conference, 17.º Europa League vía Copa, sin marcas más abajo.
- `npm test`, `typecheck`, `lint`, `qa:tech-debt` completo y `npm run test:e2e` pasan.
