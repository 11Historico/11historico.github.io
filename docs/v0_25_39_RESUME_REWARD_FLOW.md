# v0.25.39 — Retomar los flujos de recompensa al recargar

## Problemas

Al recargar la página durante un flujo de recompensa, la partida se perdía a medias:

1. **Cambio de entrenador de la ruleta:** `coachBeforeReward` no se guardaba. Tras recargar, la barra "Cancelar cambio y volver a la Liga" no aparecía, así que no había forma de volver atrás.
2. **Reemplazo de jugador:** la pantalla al cargar salía de la fase guardada (`player_selection`), no del flujo. Se perdía el selector de reemplazo o el draft del sustituto.

## Cambio

- `src/storage/localGameStorage.ts`: la partida guarda `coachBeforeReward`, `replacementDraftSeason`, `replacementRemovedPlayer` y `replacementOriginalFormation`. Son campos opcionales: las partidas antiguas cargan igual.
- `src/app/careerRewardFlow.ts`: `getRewardFlowResumeScreen` decide la pantalla a retomar según el flujo guardado.
- `src/App.tsx`: al cargar, restaura esos campos y usa la pantalla de `getRewardFlowResumeScreen`. La instantánea que se guarda incluye los mismos campos.

## Validación

- `tests/unit/rewardFlowResume.test.ts`: 4 pruebas del mapeo de pantallas.
- `tests/e2e/reward-flow-resume.spec.ts`: 2 pruebas. Recargan con cada flujo en curso. Se han comprobado contra el código anterior: fallan, y con el cambio pasan.
- `npm run typecheck`, `npx eslint src scripts`, `npm test` (98 pruebas).
- `npm run qa:ci` y `npm run qa:tech-debt` en verde.
- `npx playwright test`: 10 pruebas en verde.

## Lo que no cubre

- El cambio de formación de la carrera al recargar (con el jugador retirado) queda cubierto solo por la unitaria del mapeo, no por E2E.
