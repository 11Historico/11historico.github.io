# v0.25.47 — El equipo del usuario vuelve a "Athletic Club Histórico"

## Decisión

El usuario pide revertir el nombre del equipo del juego a "Athletic Club Histórico" y que la camiseta vuelva a ser roja y blanca. Revierte la decisión de v0.25.45 (equipo "Once Histórico"). La marca del producto "Once Histórico" (v0.25.44) no cambia.

## Por qué la camiseta vuelve a ser roja y blanca

La camiseta del equipo del usuario se elige por su nombre (`getTeamKitClass` en `LeagueSimulatorView.tsx`). La clase de la camiseta del club (`team-kit-athletic`, blanco con rojo `#d4002a`) se asigna si el nombre contiene "athletic club historico". Con el nombre "Once Histórico" no coincidía y se usaba la camiseta gris por defecto. Al restaurar el nombre vuelve la camiseta roja y blanca, sin cambios en el CSS.

## Cambio

Restaura los ficheros de código que cambió v0.25.45 (desde el estado de la versión 0.25.44):

- `src/simulation/leagueTable.ts`: `USER_TEAM_NAME = "Athletic Club Histórico"`.
- Pantallas y textos: `TeamSummary.tsx`, `LeagueSimulatorView.tsx`, `FinalSummary.tsx`, `App.tsx`.
- Europa y liga: `EuropeanMatchEvent.tsx`, `EuropeanProgressPanel.tsx`, `EuropeanQualificationCard.tsx`, `seasonLuckWheelText.ts`, `supercopaRules.ts`, `leagueSimulator.ts`.
- Textos para compartir: "Mi Athletic Histórico" en `shareCard.ts` y `shareRetention.ts`.
- Tests y QA: `tests/unit/seasonBrackets.test.ts`, `tests/unit/seasonBracketsView.test.tsx`, `scripts/qaEuropeanQualificationUi.ts`.

No cambia la marca del producto ("Once Histórico"), los datos reales ni la nota de no afiliación.

## Riesgo legal

Vuelve a usarse el nombre del club y su camiseta roja y blanca como identidad del equipo del usuario. En el análisis de la fase 16 se había decidido no usar la camiseta del club. Este cambio reabre ese punto y debe revisarlo la asesoría antes de ampliar el alcance. Ver `docs/FASE16_MARCA.md`.

## Validación

- `npm run typecheck` y `npx eslint src scripts`.
- `npm test`.
- `npm run qa:ci`.
- `npx playwright test`.
