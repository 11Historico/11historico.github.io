# v0.25.51 — Partido europeo con progreso en directo, como en Liga

## Problema

Al simular un partido europeo, el resultado aparecía casi de golpe. La secuencia del partido europeo no tenía goles con minuto: el motor descartaba los goles de la simulación y la pantalla solo revelaba el marcador al final.

## Cambio

- `src/europe/europeanTypes.ts`: nuevo tipo `EuropeanGoalEvent` (minuto, si es gol del usuario y goleador opcional). `EuropeanTournamentMatch` guarda `goalEvents` del tiempo reglamentario. Es opcional: los partidos guardados antes de esta versión siguen cargando.
- `src/europe/europeanMatchEngine.ts`: `simulateEuropeanMatch` devuelve los goles del tiempo reglamentario con minuto, obtenidos de la misma simulación que ya usaba. El marcador y el resultado no cambian.
- `src/europe/europeanTournament.ts`: `applyEuropeanMatchResult` guarda esos goles en el partido.
- `src/components/europeanMatchSequenceTimeline.ts`:
  - El tramo de previa y el de 90' usan las mismas duraciones que la secuencia de Liga (1000 ms y 2800 ms).
  - El fotograma del tramo normal incluye el minuto.
  - Nueva `getEuropeanLiveScore`: cuenta los goles visibles hasta ese minuto.
- `src/components/EuropeanMatchEvent.tsx`: durante el tramo normal, el marcador se actualiza gol a gol, igual que en Liga. Prórroga y penaltis se mantienen.

## Efecto en la duración

La secuencia europea sin prórroga dura 3,8 s, igual que en Liga. Con prórroga y penaltis dura 6,8 s (antes 6,4 s). Los tests y el QA de velocidad se han actualizado a esos valores.

## Lo que no cubre

- No muestra goleadores: el motor de partidos europeos no asigna jugadores (`selectedPlayers` vacío).
- La comprobación visual en una partida europea real queda pendiente.

## Validación

- `npm run typecheck` y `npx eslint src scripts`: sin errores.
- `npm test`: 100/100.
- `npm run qa:ci`: 30 scripts en verde.
- `npx playwright test`: 12/12.
