# v0.25.41 — Cierre del reemplazo de jugador en un parche puro

## Problema

`handleCancelPlayerReplacement` y `handleSelectReplacementPlayer` en `src/App.tsx` repetían el mismo cierre del flujo de reemplazo: seis cambios de estado (sorteo, jugador retirado, formación original, flujo de recompensa, errores de validación) y, en la cancelación, el snapshot de recompensa.

## Cambio

- `src/app/careerRewardFlow.ts`: `endReplacementFlowPatch()` devuelve el parche que limpia `careerRewardFlow`, `replacementDraftSeason`, `replacementRemovedPlayer`, `replacementOriginalFormation` y `teamValidationErrors`.
- `src/App.tsx`: ambas funciones aplican ese parche con `applyCareerRewardFlowPatch`. El snapshot de recompensa sigue limpiándose en `App.tsx`, porque no forma parte de `CareerRewardFlowState`.
- `tests/unit/careerRewardFlow.test.ts`: prueba del parche.

No cambia el comportamiento de la app.

## Validación

- `npm run typecheck` y `npx eslint src scripts`: sin errores.
- `npm test`: 99 pruebas en verde.
- `npm run qa:ci`: 30 scripts en verde.
- `npx playwright test`: 12 pruebas en verde.

## Lo que no cubre

- El paso de elegir sustituto en el draft (`handleSelectReplacementPlayer`) solo queda cubierto por la prueba unitaria del parche. No hay prueba E2E para ese camino.
