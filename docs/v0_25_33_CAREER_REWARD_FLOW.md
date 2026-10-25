# v0.25.33 — Flujo de recompensas de la carrera en transiciones puras

Fase 13 del roadmap (`docs/ROADMAP_AUDITORIA_v0_25_22.md`), segundo corte.

## Diseño

Se aprobó un `useReducer` para el flujo. Al implementarlo, el resto del estado de `App.tsx` (41 `useState` en total) se modifica desde muchos otros sitios, así que un reducer parcial habría dejado el estado repartido. Se ha hecho en su lugar:

- Transiciones **puras**: cada una recibe lo necesario y devuelve un parche (`Partial<CareerRewardFlowState>`).
- `App.tsx` aplica el parche con `applyCareerRewardFlowPatch`, que llama a cada setter solo para los campos del parche.
- Las comprobaciones de cada handler (`if (!selectedFormation || !selectedCoach) return;`) siguen en `App.tsx`, junto con los efectos secundarios (`ensureCareerRewardSnapshot`, `recalculateVisibleTeamRating`).

## Cambios

- `src/app/careerRewardFlow.ts`: `startLuckWheelPlayerChange`, `startLuckWheelCoachChange`, `cancelLuckWheelCoachChange`, `startCareerCoachChange` y `hasSpecialCoachBonus`.
- `src/app/appScreen.ts`: tipo `AppScreen`, movido desde `App.tsx`.
- `src/App.tsx`: los cuatro handlers usan las transiciones. `App.tsx` pasa de 1.738 a 1.705 líneas.
- `tests/unit/careerRewardFlow.test.ts`: 8 pruebas de las transiciones y del bonus.
- `scripts/qaLuckWheelRealRewards.ts`: la comprobación de texto apunta ahora al módulo puro.

## Verificación

- Comparación campo a campo de cada handler antiguo con su parche: coinciden.
- Pruebas unitarias: 81 en verde.
- `qa:ci` y `qa:tech-debt` en verde.
- Playwright: 7 pruebas en verde.

## Lo que las pruebas automáticas no cubren

Las pruebas E2E actuales solo recorren la ruleta con "No jugar". **Los flujos de cambio de jugador y de entrenador por la ruleta no tienen prueba E2E.** Antes de dar esta fase por cerrada, probar a mano en una carrera:

1. Ganar un premio de cambio de jugador en la ruleta: debe llevar al reemplazo y volver a la liga.
2. Ganar un premio de cambio de entrenador: debe mostrar el entrenador anterior y permitir cancelar; al cancelar, vuelve a la liga con ese entrenador.
3. Cambio de entrenador desde la pantalla entre temporadas, con y sin bonus.
