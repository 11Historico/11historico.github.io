# v0.25.97 — Balance europeo al cerrar la temporada

Fase 7 del roadmap `docs/ROADMAP_MEJORAS_v0_25_91.md`. Con ella se cierra la ola 3, «influencia visible en Europa».

El usuario cayó en la fase inicial europea todas las temporadas y no sabía si era mala suerte o algo que hacía mal. El informe `INFORME_EUROPA_E_INFLUENCIA_v0_25_91.md` midió que, con 84 en Europa League, se pasa un 33 % de las veces decidiendo bien.

## Cambio

En «Temporada superada» y en «Game Over», si la temporada tuvo Europa, una línea dice qué pasó y qué era lo normal:

- «Europa: caíste en la fase inicial (4.º de 7). Con tu equipo, lo normal era pasar 1 de cada 3 veces.»
- «Europa: pasaste a semifinales. Con tu equipo, lo normal era pasar 6 de cada 10 veces.»

**Cómo se dice la probabilidad:**

| Probabilidad | Texto |
| --- | --- |
| Menos del 5 % | casi nunca |
| Del 5 % al 50 % | 1 de cada N veces (redondeado) |
| Más del 50 % y menos del 95 % | X de cada 10 veces |
| 95 % o más | casi siempre |

## Cómo se calcula

- **Cuándo:** al acabar la Liga, `LeagueSimulatorView` calcula la probabilidad de pasar que había antes del primer partido europeo (`estimateEuropeanSemifinalChanceAtStart`) y la guarda en el resumen de la temporada (`FinalGameSummary.europeanSemifinalChanceAtStart`).
  - **Con qué partidos:** los mismos rivales y el mismo torneo, pero sin ningún resultado. Es el cálculo de la v0.25.95, con 200 simulaciones y semillas propias.
  - **Con qué rating:** el equipo es el del final de la temporada, con su rating europeo y sus líneas.
  - **Coste:** unas décimas de segundo, una sola vez.
- **Qué pasó:** sale del torneo. Si pasaste a semifinales, se dice eso. Si no, el puesto en la tabla de la fase inicial.
- **Cuándo no sale:**
  - si la fase de liga no se terminó;
  - si la partida se guardó antes de esta versión y no tiene la probabilidad.

## Archivos

- `src/europe/europeanSemifinalChance.ts`: `estimateEuropeanSemifinalChanceAtStart` y `getEuropeanSeasonBalanceText`.
- `src/types/game.ts`: `FinalGameSummary.europeanSemifinalChanceAtStart`.
- `src/components/LeagueSimulatorView.tsx`: lo calcula al acabar la Liga.
- `src/components/CareerSeasonOutcome.tsx`: la línea, junto al balance de decisiones.

## Comprobación

- **`tests/unit/europeanSemifinalChance.test.ts`:**
  - la probabilidad al empezar no depende de los resultados;
  - los textos, también sin probabilidad o con la fase sin acabar.
- **Navegador**, con la partida `career-strong` en Europa League y una temporada entera: «Europa: pasaste a semifinales. Con tu equipo, lo normal era pasar 1 de cada 3 veces.»
- `npm run typecheck`, `npx eslint src scripts`, `npm test`, `npm run qa:ci` y Playwright.
