# v0.25.70 — Puntos al acabar el partido y palmarés en la temporada superada

## Problema

1. **Puntos que parecían mal sumados.** En la pantalla de Liga, el partido se juega en directo, pero el resultado ya estaba aplicado desde el minuto 0: la posición, los puntos de la cabecera, la clasificación, los últimos resultados y las estadísticas cambiaban al empezar el partido. Si el rival marcaba primero en una victoria, se veía el +3 con el marcador en contra. Al acabar, no cambiaba nada.
2. **Sin palmarés en la temporada superada.** La pantalla de Game Over muestra la vitrina, pero la de temporada superada no tenía forma de verla.

## Revisión del cálculo

El cálculo era correcto. Una prueba temporal simuló 20 temporadas (760 partidos de Liga) y comprobó en cada partido que:

- los puntos suben 3, 1 o 0 según el marcador;
- la insignia (Victoria, Empate o Derrota) coincide con el marcador;
- los goles con minuto de la secuencia en directo coinciden con el marcador final.

No hubo ninguna discrepancia. La prueba queda en el repositorio con 5 temporadas.

## Cambio

- **`src/components/LeagueSimulatorView.tsx`:**
  - Guarda el contexto de antes del último partido (`contextBeforeResult`) en cada punto donde se juega: simulación automática, «Saltar hasta próximo evento», partido de Copa y «Simular Copa y terminar temporada».
  - Mientras la secuencia se reproduce, muestra ese contexto (`shownContext`). Afecta a la posición y los puntos de la cabecera, el texto «Jornada N / 38», la clasificación, la Copa, los últimos resultados y las estadísticas.
  - La lógica (partidos pendientes, bloqueo europeo y orden de tarjetas) sigue usando el contexto real.
- **`src/components/MatchSequence.tsx`:** avisa de que el partido está en juego con `useLayoutEffect`, antes del primer pintado. Así no hay un fotograma con los puntos nuevos antes de retenerlos.
- **`src/components/CareerSeasonOutcome.tsx`:** botón «Ver palmarés» / «Ocultar palmarés» en la temporada superada. Muestra la misma vitrina que el Game Over, con los títulos acumulados más los de la temporada que acaba de terminar.

## Pruebas

- **`tests/unit/leaguePoints.test.ts` (nuevo):** 5 temporadas; en cada partido de Liga comprueba puntos, insignia y goles con minuto.
- **`tests/e2e/season-challenge.spec.ts`:** en la temporada superada, «Ver palmarés» muestra la vitrina.
- **Comprobación temporal en el navegador:** con la partida de prueba, tres partidos seguidos (victoria, empate y derrota). Durante cada partido, la cabecera, la fila de la clasificación y los últimos resultados no cambiaron. Al acabar, los puntos subieron 3, 1 y 0.

## Qué no cambia

Simulación, cálculo de puntos, reglas de Liga, Copa y Europa, balance y ranking.

## Validación

- `npm run typecheck` y `npx eslint src scripts` sin errores.
- `npm test` (115 tests) y `npm run qa:ci` en verde.
- `npx playwright test`: 15 tests en verde y 2 saltados.
