# Semillas de auditoría como las del juego (sobre v0.25.106)

Solo cambian las auditorías. El juego no cambia y no hay versión nueva.

## Qué estaba mal

En el juego, el torneo europeo se sortea con `${gameId}_${temporada}`, con `gameId = game_<fecha>_<hex>` (`App.tsx`). Cuatro auditorías usaban semillas cortas y seguidas (`audit_1_…`, `audit_2_…`):

- `auditCareerRunner.ts`;
- `auditEuropePhase.ts`;
- `auditEuropeanRivalStyles.ts`;
- `auditEuropeanOpponents.ts`.

Con ellas, el hash de `europeanOpponents.ts` apenas cambia de un torneo a otro y el sorteo se repite. Por eso el VfB Stuttgart salía en el 52 % de los torneos de la auditoría, cuando en el juego sale en su parte justa (ver `tests/unit/europeanDraw.test.ts`).

## Cambio

- Nuevo `scripts/auditSeeds.ts` con `auditGameId(index)`. Devuelve un gameId determinista con la forma de los del juego, igual que el que usa el test del sorteo.
- Las cuatro auditorías lo usan para la semilla del torneo (`${gameId}_${temporada}`) y la del partido (`${gameId}_${match.id}`), igual que `LeagueSimulatorView`.
- El módulo es independiente para no importar `auditCareerRunner.ts`, que sustituye `Date.now` y `Math.random`.

## Medido antes y después

**`audit:european-opponents`, 2000 sorteos.** Parte justa: 40 % en Champions y Europa League, 80 % en Conference.

| Competición | Antes (mín.–máx.) | Después (mín.–máx.) |
| --- | --- | --- |
| Champions | 37 %–46 % (Manchester City) | 38 %–42 % |
| Europa League | 38 %–52 % (VfB Stuttgart) | 38 %–42 % |
| Conference | 79 %–83 % | 79 %–81 % |

La probabilidad de pasar la fase de liga sin decidir no cambia en más de 1 punto.

**`audit:europe`, 600 torneos por casilla.** Pase a semifinales:
- Champions y Europa League: se mueve 4 puntos o menos, en ambos sentidos.
- Conference: sube en todas las filas, entre 1 y 7 puntos, y más con ratings bajos. Por ejemplo, con 86 y sin decidir pasa del 58 % al 64 %.
- Las semillas viejas daban un conjunto de torneos algo pesimista en Conference.

**`audit:european-styles`, 20 000 partidos y 2000 torneos.** Todas las celdas quedan a 2 puntos o menos de antes. La conclusión del informe de estilos no cambia.

**`audit:rating`, 600 carreras por casilla.** Todo queda dentro del margen.

| Caso | Temporadas antes → después | Títulos/temporada antes → después | Puntuación antes → después |
| --- | --- | --- | --- |
| Normal, mejor media | 2.24 → 2.25 | 0.35 → 0.35 | 27.38 → 27.56 ±1.93 |
| Normal, al azar | 0.90 → 0.91 | 0.18 → 0.19 | 10.56 → 10.76 ±1.13 |
| Fácil, mejor media | 3.63 → 3.50 | 0.48 → 0.47 | 46.27 → 44.38 ±3.03 |
| Fácil, al azar | 1.80 → 1.82 | 0.31 → 0.31 | 21.84 → 22.07 ±1.73 |

## Qué no se toca

- `auditMatchApproach.ts` y los scripts `qa*`: usan semillas de partido sueltas, sin sorteo europeo, y sus comprobaciones no dependen de él.
- `auditLineCap.ts`, `auditLeagueDecisions.ts` y `auditSimulationRating.ts` heredan el cambio a través de `playCareer`.
- Los informes anteriores conservan sus números: se midieron con las semillas de entonces.

## Validar

```powershell
npm run typecheck
npx eslint scripts
npm test
npm run qa:ci
npm run audit:european-opponents
npm run audit:rating -- --careers=600 --only=1
```
