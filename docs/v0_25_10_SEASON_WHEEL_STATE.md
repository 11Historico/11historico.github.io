# v0.25.10 — Estado de la ruleta de temporada

Corte pequeño de la ruleta de temporada. Es un refactor sin cambio de comportamiento.

## Qué cambia

- `buildAcceptedSeasonLuckWheelState(result, offeredAt)` en `src/career/seasonLuckWheel.ts`: convierte el resultado de la ruleta en el estado que se guarda en la carrera. Antes estaba escrito a mano dentro de `LeagueSimulatorView`.
- `src/components/LeagueSimulatorView.tsx` usa esa función.

## Lo que no cambia y por qué

- `src/App.tsx` sigue igual en la parte de la ruleta. Su lógica son decisiones de flujo mezcladas con el estado: a qué pantalla volver al cancelar un cambio de jugador o de entrenador, y cuándo limpiar el premio. Separarla bien pide diseñar primero una máquina de estados, y no es un corte pequeño.

## Validación

- `tests/unit/seasonLuckWheelState.test.ts`: 2 pruebas (mapeo completo del resultado y requisitos de cambio).
- `npm test`, `typecheck`, `lint`, `qa:tech-debt` completo y `npm run test:e2e` pasan.
