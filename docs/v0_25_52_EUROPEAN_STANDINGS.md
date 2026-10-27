# v0.25.52 — Clasificación de la fase de liga europea

## Problema

La competición europea no tenía una clasificación: solo se veían los partidos del usuario.

## Cambio

- `src/europe/europeanLeagueTable.ts`: `buildEuropeanLeaguePhaseTable` calcula la tabla de la fase de liga.
  - Son 7 equipos: el usuario y sus 6 rivales. Cada uno juega 6 partidos, todos contra todos una vez.
  - Los partidos del usuario son los reales ya jugados.
  - Los 15 partidos entre rivales se simulan con el mismo motor, con semilla fija (temporada, competición y pareja). Se reparten en las jornadas del usuario y solo cuentan cuando esa jornada ya se ha jugado.
  - Orden: puntos, diferencia de goles, goles a favor y nombre.
- `src/components/EuropeanLeagueTable.tsx`: muestra la tabla con las mismas clases que la clasificación de liga.
- `src/components/LeagueSimulatorView.tsx`: botón "Ver clasificación europea" en la fila de acciones, en modo carrera con torneo europeo. Al pulsarlo, la tabla aparece debajo de la tarjeta de acciones.

## Lo que no cubre

- Los partidos entre rivales no tienen goleadores ni minutos: son solo marcadores, como el resto del motor europeo.
- No calcula la clasificación para la siguiente fase (eliminatorias): la tabla es informativa.

## Validación

- `npm run typecheck` y `npx eslint src scripts`: sin errores.
- `npm test`: 103/103 (4 pruebas nuevas de la tabla).
- `npm run qa:ci`: 30 scripts en verde.
- `npx playwright test`: 12/12.
- Pendiente: comprobación visual de la tabla en una partida europea real.
