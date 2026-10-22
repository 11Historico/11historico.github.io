# v0.24.9h — Reparto europeo real de LaLiga (7 plazas)

## Problema

Las reglas de clasificación europea del juego usaban 5º-6º Europa League y 7º Conference, sin tener en cuenta al campeón de Copa externo. Con el reparto real de LaLiga hay 7 plazas (4 Champions, 2 Europa League, 1 Conference).

## Regla aplicada

Fuentes: prensa deportiva (Goal, BeIN Sports, Wikipedia de la Copa del Rey). No se ha encontrado el reglamento oficial de LaLiga/UEFA en fuentes abiertas, así que la regla queda documentada como reconstrucción.

- 1º-4º: Champions League.
- 5º: Europa League.
- 6º: Conference League.
- Plaza de Copa del Rey (Europa League): para el campeón de Copa externo.
  - Si el campeón de Copa ya está en Europa por Liga (1º-5º), su plaza pasa al 6º (Europa League) y el 7º recibe Conference League.
  - Si el campeón de Copa queda 6º, conserva la plaza de Copa y el 7º recibe Conference League.
  - Si el campeón está fuera de Europa por Liga (7º o peor, o desconocido), la plaza de Copa es suya y el reparto de Liga no cambia.
- Ganar la Copa siendo usuario: Europa League mínimo, como antes (`copa_winner`).
- El finalista de Copa no recibe plaza europea.

## Cambios

- `src/europe/europeanQualification.ts`: `getLeagueCompetitionSpot` (reparto de Liga con reasignación), `resolveEuropeanQualification` admite `copaWinnerLeaguePosition`. Source `league_reallocation` cuando la plaza es reasignada.
- `src/career/careerRules.ts`: `getEuropeanQualification` (el que decide el objetivo de carrera y el Game Over) usa el mismo reparto.
- `src/types/career.ts`: `CareerSeasonResult.copaWinnerLeaguePosition` (opcional; partidas antiguas siguen usando el reparto sin campeón conocido).
- `src/App.tsx`: calcula la posición del campeón de Copa externo a partir de la tabla final.
- QA: `scripts/qaEuropeanQualification.ts` y `scripts/qaEuropeanPersistence.ts` actualizados al nuevo reparto.

## No tocado

Ratings, plantillas, historial de temporadas ya guardadas (no se recalculan), balance de Liga y Copa, premios y prestigio.

## Caso de referencia

Campeón de Copa externo en Champions por Liga (1º-4º): el 8º no recibe plaza europea. El 7º recibe Conference League.

## Validación

```powershell
npm run qa:european-qualification
npm run qa:european-persistence
$env:VITE_GLOBAL_RANKING_ENDPOINT=""; npm run qa:tech-debt
```
