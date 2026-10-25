# v0.25.7 — Corte de App.tsx: draft y validación del equipo

Primer corte del punto P2 del informe (frontend y CTO): partir `src/App.tsx` por dominios. Es un refactor puro: no cambia comportamiento, gameplay, balance ni ranking.

## Qué se mueve

- `src/app/draftSeasons.ts`: sorteo de temporadas del draft (`getSeasonYearNumber`, `getSeasonDecadeBucket`, `pickRandomSeason`, `createRandomPlayerRoundSeasons`, `getDraftSeasonPool`).
- `src/app/teamValidation.ts`: `TOTAL_PLAYER_ROUNDS`, `validateSelectedTeam` y `sanitizeSelectedPlayers`.

Son funciones puras que no dependen del estado de la aplicación. `App.tsx` las importa.

## Qué no se mueve (siguientes cortes)

- El guardado de partida: el efecto de guardado depende de unos 40 estados a la vez. Es el corte más delicado.
- Los estados de carrera, ruleta y Europa, que todavía viven en `App.tsx`.

## Validación

- `tests/unit/appModules.test.ts`: 7 pruebas nuevas (sorteo sin repetir, lista de temporadas, errores, validación de formación y saneado).
- `npm test` (42 pruebas), `typecheck`, `lint`, `qa:tech-debt` completo y `npm run test:e2e` (3 pruebas) pasan.
