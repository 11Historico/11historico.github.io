# v0.25.26 — Carga diferida de pantallas

Fase 10 del roadmap (`docs/ROADMAP_AUDITORIA_v0_25_22.md`).

## Medición

| Fichero | Antes | Después |
|---|---|---|
| JS principal (`index-*.js`) | 537,38 kB (151,26 kB gzip) | 385,83 kB (114,11 kB gzip) |
| `athletic-data` | 307,15 kB | 307,15 kB (sin cambio) |

El aviso de 500 kB de Vite deja de saltar en el bundle principal.

## Cambio

- `src/App.tsx`: 11 componentes pasan de `import` estático a `lazy(() => import(...))`: `LeagueSimulatorView`, `FinalSummary`, `CareerSeasonOutcome`, `CareerInterseasonReward`, `CareerGlobalRanking`, `CareerLocalRanking`, `CareerSupercopa`, `CareerFormationChangePicker`, `CareerPlayerReplacementPicker`, `PlayerRound` y `CoachRound`.
- La interfaz se envuelve en un único `Suspense` con un estado de carga mínimo ("Cargando…").
- Se mantienen en la carga principal: portada, pantalla de entrada a la carrera, selección de formación y la barra de fases.

## Validación

- `npm run typecheck`, `npx eslint src scripts`, `npm test` (73 pruebas).
- `npm run qa:ci` (29 QA) en verde.
- `npx playwright test` (7 pruebas): cubren la liga, la carrera completa y el reto de temporada superada, que pasan por las pantallas cargadas en diferido.

## Pendiente

- No se ha revisado si los componentes europeos que no están en la lista (`EuropeanMatchEvent`, `TacticalPitch`) deben ir en diferido. El build ya los separa en ficheros propios cuando se usan desde pantallas cargadas en diferido.
