# v0.25.117 — La tabla europea, jornada a jornada

El usuario vio, tras dos jornadas de la fase de liga europea, al Dinamo Tbilisi con 5 puntos y al Zimbru con 6 puntos y diferencia de goles 0: imposible con dos partidos. Pidió «haz el arreglo y la PJ».

## Lo que fallaba

El juego solo guarda los seis partidos del usuario. Los 15 partidos entre rivales se simulan y se reparten en sus jornadas (`getEuropeanRivalPairs`, en `europeanLeagueTable.ts`, de la v0.25.52). El reparto, `pairs.length % 6`, ponía a algunos rivales dos partidos en la misma jornada y a otros ninguno. Partidos de cada rival, con los rivales en el orden en que te tocan:

| Tras la jornada | Antes | Ahora |
| --- | --- | --- |
| 1 | 2 2 0 2 1 0 | 1 1 1 0 1 1 |
| 2 | 3 4 1 3 2 1 | 1 2 2 1 2 2 |
| 3 | 4 5 2 4 3 3 | 2 3 3 2 2 3 |
| 4 | 5 5 3 6 4 3 | 3 3 4 3 3 4 |
| 5 | 6 5 4 6 6 4 | 4 4 5 4 4 4 |
| 6 | 6 6 6 6 6 6 | 6 6 6 6 6 6 |

## Ahora

- **El calendario de una liga de 7 equipos:** el usuario es el 0 y el rival i-ésimo, el i + 1. En la jornada r se enfrentan los que suman r módulo 7.
  - El usuario juega contra el rival r, que no juega otro partido esa jornada, y otro rival descansa.
  - Los tres partidos de la jornada en que descansaría el usuario cuentan con su sexta.
  - Tras la jornada k, cada equipo lleva k o k − 1 partidos.
- **La tabla enseña los partidos jugados (PJ),** entre el equipo y los puntos.

**Lo que no cambia:** cada partido entre rivales se sigue simulando con la misma semilla, así que da el mismo resultado; solo cambia en qué jornada cuenta. La tabla final es la misma, y con ella el pase a semifinales, la previa del 3.º contra el 4.º y el prestigio europeo, que solo la leen al acabar la fase. La probabilidad de pasar a semifinales se mueve un poco mientras dura la fase, porque parte de la tabla buena.

## En el código

- **`src/europe/europeanLeagueTable.ts`:** la jornada de cada pareja en `getEuropeanRivalPairs`.
- **`src/components/EuropeanLeagueTable.tsx` y `LeagueSimulatorView.css`:** la columna PJ, solo en la tabla europea.
- **`tests/unit/europeanLeagueTable.test.ts`:** dos tests nuevos.

## Comprobación

- **La tabla final, igual que antes:** comparada con la de la v0.25.116 en 90 casos (30 temporadas × 3 competiciones, con los 6 partidos jugados). Es idéntica.
- **Tests nuevos:**
  - tras la jornada k nadie lleva más de k partidos, y al final todos llevan 6;
  - cada pareja se enfrenta una vez, y el rival de tu jornada no juega otro partido en ella.
- **En el navegador,** con la partida de prueba `career-strong` y dos partidos de Conference ganados: los rivales llevan 1 o 2 partidos (antes, hasta 4). A 375 px, las cinco columnas caben sin salirse de la pantalla. Sin errores en la consola.
- Pasan `npm run typecheck`, `npx eslint src scripts`, `npm test` (267), `npm run qa:ci` y `npm run test:e2e` (22 pasan, 2 se saltan).
