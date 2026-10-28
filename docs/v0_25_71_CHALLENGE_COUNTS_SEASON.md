# v0.25.71 — El reto cuenta la temporada superada

## Problema

En la pantalla de temporada superada, el bloque «Reta a otros jugadores» no contaba la temporada que se acababa de superar. Tras la primera temporada mostraba «0 puntos y 0 temporadas superadas», y el enlace de reto llevaba esa marca. La temporada solo se sumaba al pulsar «Continuar carrera».

## Decisión

Confirmado por el usuario: la temporada superada cuenta ya en el reto.

## Cambio

- **`src/components/CareerSeasonOutcome.tsx`:** si la temporada se supera, el reto usa `completedSeasons + 1`, el mismo valor que `App.tsx` guarda al pulsar «Continuar carrera». Los títulos y la mejor posición en Liga de la temporada ya se sumaban (`buildCareerLocalRankingEntry`). El texto usa el singular con 1 temporada.
- **`src/components/ChallengeBanner.tsx`:** el aviso de reto recibido también usa el singular con 1 temporada, porque ahora puede llegar un reto de 1 temporada.

## Qué no cambia

La fórmula de puntos (10 por temporada superada más el palmarés), el ranking local y global, el Game Over y la carrera.

## Pruebas

- **`tests/e2e/season-challenge.spec.ts`:** la partida guardada trae 3 temporadas superadas; al superar la siguiente, el reto muestra 4.

## Validación

- `npm run typecheck` y `npx eslint src scripts` sin errores.
- `npm test` y `npm run qa:ci` en verde.
- `npx playwright test`: 15 tests en verde y 2 saltados.
