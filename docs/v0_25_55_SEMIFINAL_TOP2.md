# v0.25.55 — Semifinal europea: pasan los 2 primeros de la fase de liga

## Problema

El pase a semifinales exigía 10 puntos en la fase de liga, pero desde v0.25.52 hay una clasificación de la fase de liga (7 equipos). Las dos reglas podían contradecirse: ir 2.º sin llegar a 10 puntos, o pasar con 10 puntos yendo 4.º.

## Decisión

Por decisión del usuario, pasan a semifinales los 2 primeros de la tabla de la fase de liga.

## Cambio

- `src/europe/europeanTournament.ts`:
  - `EUROPEAN_LEAGUE_PHASE_QUALIFYING_POSITIONS = 2` sustituye a `EUROPEAN_LEAGUE_PHASE_QUALIFICATION_POINTS = 10`.
  - Nueva `getEuropeanLeaguePhaseUserPosition`: posición del usuario en la tabla de `buildEuropeanLeaguePhaseTable`.
  - Al cerrar los 6 partidos, el usuario pasa a semifinales si está entre los 2 primeros; si no, queda eliminado.
  - El texto de lo que está en juego explica la regla nueva.
- `src/components/EuropeanProgressPanel.tsx`: el objetivo de la fase inicial dice "terminar entre los 2 primeros".
- `src/components/EuropeanLeagueTable.tsx`: nota "Pasan a semifinales los 2 primeros", marca de color en esos puestos y cálculo memorizado con `useMemo`.
- `src/components/LeagueSimulatorView.css`: estilo de la nota y de los puestos que pasan.

## Efecto en el juego

- Con 18 puntos el usuario siempre queda 1.º. Con 0 puntos siempre queda fuera.
- Entre medias depende de los partidos entre rivales, simulados con semilla fija por temporada.
- Los torneos en curso de partidas guardadas aplican la regla nueva al cerrar la fase de liga.

## QA

- `tests/unit/europeanSemifinalTop2.test.ts`: 6 victorias llevan a semifinales y 6 derrotas eliminan.
- `scripts/qaEuropeanKnockouts.ts`, `scripts/qaEuropeanTournamentSkeleton.ts`, `scripts/qaEuropeanRewardsPrestige.ts`, `scripts/qaEuropeanBalance.ts` y `scripts/qaEuropeanProgressUi.ts`: dejan de usar la muestra de 10 puntos (3 victorias, 1 empate y 2 derrotas), que con la regla nueva no garantiza el pase, y usan 6 victorias o 6 derrotas.

## Validación

- `npm run typecheck` y `npx eslint src scripts`: sin errores.
- `npm test`: 107/107.
- `npm run qa:ci`: 30 scripts en verde.
- `npx playwright test`: 12/12.
