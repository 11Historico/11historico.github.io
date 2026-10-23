# Fase 2 — Prueba intermitente en Playwright

Investigación del fallo intermitente de `career-full-flow` (y de la prueba de temporada superada). Fase 2 del roadmap (`docs/ROADMAP_AUDITORIA_v0_25_22.md`). No cambia la versión del juego.

## Reproducción

- Suite completa sin reintentos, 10 ejecuciones seguidas: 1 fallo (1 de 10).
- Tras el primer arreglo, 12 ejecuciones seguidas: 2 fallos, en dos pruebas distintas.

## Causa raíz

La liga usa una semilla aleatoria en cada temporada (`src/simulation/leagueSimulator.ts`): `Date.now() + Math.floor(Math.random() * 1000000)`. El mismo fixture puede terminar de forma distinta en cada ejecución. Las pruebas asumían un final concreto:

1. **`career-full-flow`** (plantilla débil): la prueba esperaba siempre Game Over. En algunas ejecuciones el equipo se clasificó para Europa, la temporada se superó y la pantalla "Entre temporadas" no tenía el botón de avance previsto. Error: "La carrera no ofrece ningún paso de avance".
2. **`career-full-flow`** (falso positivo): el bucle se detenía al ver el texto "game over" en cualquier elemento. En una temporada superada apareció ese texto en otra zona y la prueba buscó el Game Over en una pantalla equivocada.
3. **`season-challenge`** (plantilla fuerte): la prueba esperaba temporada superada siempre. Con algunas semillas el equipo fuerte acabó octavo y sin plaza europea.

## Arreglo

- `tests/e2e/seedRandomness.ts`: fija `Math.random` y `Date.now` en el navegador antes de cargar la página. Con eso el resultado de cada temporada es reproducible.
- `tests/e2e/career-full-flow.spec.ts`: semilla 1, localizador del Game Over por `heading` (no por cualquier texto) y aserción estricta de Game Over.
- `tests/e2e/season-challenge.spec.ts`: semilla 2. Se probaron las semillas 1 a 8: la 1 deja al equipo fuerte fuera de Europa; de la 2 a la 8 supera la temporada.

## Limitación

Las semillas están elegidas para que cada fixture llegue a su final esperado. Si cambia el balance de la liga (por ejemplo, la fase 9 del roadmap), puede hacer falta otra semilla. Para elegirla: probar varias semillas con la prueba afectada y fijar la primera que dé el final esperado.

## Validación

- 15 ejecuciones completas de la suite (10 + 5), todas en verde, sin reintentos.
- `tests/e2e` no está cubierto por ESLint en la configuración actual (se ignora), así que no hay lint de estos ficheros.
